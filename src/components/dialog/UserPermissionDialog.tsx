import React, { useState, useEffect } from 'react';
import {
    Button, Input, Badge, Checkbox, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '../ui';
import { Trash2, Plus, User, Shield } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { callSoapService } from "@/api/callSoapService";
import { convertDataModelToStringData } from '@/utils/dataModelConverter';
import { convertServiceDatev1 } from '@/utils/dateUtils';
import { useToast } from '@/hooks/useToast';

interface UserPermission {
    id?: string;
    PERMISSION_USER_NAME: string;
    PERMISSION_RIGHTS: string;
    PERMISSION_VALID_TILL: string;
    ENT_DATE?: string;
    userName?: string;
    displayName?: string;
    isNew?: boolean;
}

interface User {
    USER_NAME: string;
    DISPLAY_NAME?: string;
    [key: string]: any;
}

interface UserPermissionsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    document: {
        DOCUMENT_NO?: string;
        REF_SEQ_NO?: string | number;
        DOCUMENT_DESCRIPTION?: string;
    } | null;
}

const UserPermissionsDialog: React.FC<UserPermissionsDialogProps> = ({
    isOpen,
    onClose,
    document
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [permissions, setPermissions] = useState<UserPermission[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedPermission, setSelectedPermission] = useState<string[]>(['R']);
    const [validTill, setValidTill] = useState<string>('');
    const [permissionToDelete, setPermissionToDelete] = useState<UserPermission | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [error, setError] = useState<string>('');
    const { userData } = useAuth();
    const { toast } = useToast();

    const permissionOptions = [
        { value: 'R', label: 'Read', color: 'bg-blue-100 text-blue-800' },
        { value: 'W', label: 'Write', color: 'bg-green-100 text-green-800' },
        { value: 'D', label: 'Delete', color: 'bg-red-100 text-red-800' }
    ];

    useEffect(() => {
        if (isOpen && document) {
            fetchUsers();
            fetchExistingPermissions();
            setError('');
        }
    }, [isOpen, document]);

    if (!isOpen || !document) return null;

    const fetchUsers = async () => {
        if (!userData?.clientURL) {
            setError('No client URL available');
            return;
        }

        try {
            setLoadingUsers(true);
            setError('');

            const payload = {
                DataModelName: "USER_MASTER",
                WhereCondition: "",
                Orderby: "USER_NAME ASC"
            };

            const response = await callSoapService(
                userData.clientURL,
                "DataModel_GetData",
                payload
            );

            let usersData: User[] = [];
            if (Array.isArray(response)) {
                usersData = response;
            } else if (response?.data && Array.isArray(response.data)) {
                usersData = response.data;
            } else if (response?.result && Array.isArray(response.result)) {
                usersData = response.result;
            }

            if (usersData.length === 0) {
                setError('No users found');
            }

            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchExistingPermissions = async () => {
        if (!userData?.clientURL || !document?.REF_SEQ_NO) {
            setError('Missing required data for fetching permissions');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const payload = {
                DataModelName: "SYNM_DMS_DOC_USER_RIGHTS",
                WhereCondition: `REF_SEQ_NO = ${document.REF_SEQ_NO}`,
                Orderby: "PERMISSION_USER_NAME ASC"
            };

            const response = await callSoapService(
                userData.clientURL,
                "DataModel_GetData",
                payload
            );

            let permissionsData: any[] = [];
            if (Array.isArray(response)) {
                permissionsData = response;
            } else if (response?.data && Array.isArray(response.data)) {
                permissionsData = response.data;
            } else if (response?.result && Array.isArray(response.result)) {
                permissionsData = response.result;
            }

            // Format dates for display
            const mappedPermissions = permissionsData.map((perm) => {
                const user = users.find(u => u.USER_NAME === perm.PERMISSION_USER_NAME);

                // Format dates safely
                const formatDateField = (dateValue) => {
                    try {
                        if (!dateValue || dateValue === '0') return '';
                        return dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
                    } catch {
                        return '';
                    }
                };

                return {
                    id: `existing_${perm.PERMISSION_USER_NAME}_${Date.now()}`,
                    PERMISSION_USER_NAME: perm.PERMISSION_USER_NAME,
                    PERMISSION_RIGHTS: perm.PERMISSION_RIGHTS,
                    PERMISSION_VALID_TILL: formatDateField(perm.PERMISSION_VALID_TILL),
                    ENT_DATE: formatDateField(perm.ENT_DATE),
                    displayName: user?.DISPLAY_NAME || perm.PERMISSION_USER_NAME,
                    isNew: false
                };
            });

            setPermissions(mappedPermissions);
        } catch (error) {
            console.error("Error fetching existing permissions:", error);
            setError('Failed to load existing permissions');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format dates for display
    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (e) {
            return dateString;
        }
    };

    const addNewPermission = () => {
        if (!selectedUser) {
            setError("Please select a user first");
            return;
        }

        if (selectedPermission.length === 0) {
            setError("Please select at least one permission");
            return;
        }

        const user = users.find(u => u.USER_NAME === selectedUser);

        // Format the date properly
        let formattedValidTill = '';
        if (validTill) {
            const date = new Date(validTill);
            if (!isNaN(date.getTime())) {
                formattedValidTill = date.toISOString().split('T')[0];
            }
        }

        const newPermission: UserPermission = {
            id: `new_${Date.now()}`,
            PERMISSION_USER_NAME: selectedUser,
            PERMISSION_RIGHTS: selectedPermission.join(','),
            PERMISSION_VALID_TILL: formattedValidTill, // Will be empty if no date selected
            ENT_DATE: new Date().toISOString().split('T')[0],
            displayName: user?.DISPLAY_NAME || selectedUser,
            isNew: true
        };

        const existingPermission = permissions.find(p => p.PERMISSION_USER_NAME === selectedUser);
        if (existingPermission) {
            setError("This user already has permissions.");
            return;
        }

        setPermissions([...permissions, newPermission]);
        setError('');

        setSelectedUser('');
        setSelectedPermission(['R']);
        setValidTill('');
    };

    const handleDelete = async () => {
        if (!permissionToDelete || !document?.REF_SEQ_NO || !userData?.userName) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Missing required data for deletion"
            });
            return;
        }

        setIsDeleting(true);
        try {
            const deletePayload = {
                UserName: userData.userName,
                DataModelName: "SYNM_DMS_DOC_USER_RIGHTS",
                WhereCondition: `REF_SEQ_NO = ${document.REF_SEQ_NO} AND PERMISSION_USER_NAME = '${permissionToDelete.PERMISSION_USER_NAME}'`
            };

            await callSoapService(
                userData.clientURL,
                "DataModel_DeleteData",
                deletePayload
            );

            setPermissions(prev => prev.filter(p => p.id !== permissionToDelete.id));

            toast({
                title: "Permission deleted successfully",
                description: `Permission for ${permissionToDelete.displayName} has been removed`,
                duration: 2000
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error deleting permission",
                description: error instanceof Error ? error.message : "Failed to delete permission"
            });
        } finally {
            setIsDeleting(false);
            setPermissionToDelete(null);
            setShowDeleteConfirmation(false);
        }
    };

    const handleSave = async () => {
        if (!userData?.clientURL || !document?.REF_SEQ_NO || !userData?.userName) {
            setError('Missing required authentication data');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const validPermissions = permissions.filter(perm =>
                perm.PERMISSION_USER_NAME &&
                perm.PERMISSION_RIGHTS
                // && perm.PERMISSION_VALID_TILL &&
                // parseInt(perm.PERMISSION_VALID_TILL) > 0
            );

            if (validPermissions.length === 0) {
                setError("Please add at least one valid permission.");
                return;
            }

            const newPermissions = validPermissions.filter(perm => perm.isNew);

            if (newPermissions.length === 0) {
                setError("No new permissions to save.");
                return;
            }

            for (const permission of newPermissions) {
                const insertPayload = {
                    REF_SEQ_NO: document.REF_SEQ_NO,
                    PERMISSION_USER_NAME: permission.PERMISSION_USER_NAME,
                    PERMISSION_RIGHTS: permission.PERMISSION_RIGHTS,
                    PERMISSION_VALID_TILL: permission.PERMISSION_VALID_TILL || null,
                    USER_NAME: userData.userName,
                    ENT_DATE: new Date().toISOString().split('T')[0]
                };

                const data = convertDataModelToStringData(
                    "SYNM_DMS_DOC_USER_RIGHTS",
                    insertPayload
                );

                const payload = {
                    UserName: userData.userEmail,
                    DModelData: data,
                };

                const response = await callSoapService(
                    userData.clientURL,
                    "DataModel_SaveData",
                    payload
                );

                if (response?.error || (response && response.success === false)) {
                    throw new Error(`Failed to save permission for ${permission.PERMISSION_USER_NAME}: ${response?.error || 'Unknown error'}`);
                }
            }

            alert("Permissions saved successfully!");
            await fetchExistingPermissions();

        } catch (error) {
            console.error("Error saving permissions:", error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save permissions. Please try again.';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const getPermissionBadgeColor = (rights: string) => {
        const option = permissionOptions.find(opt => opt.value === rights);
        return option?.color || 'bg-gray-100 text-gray-800';
    };

    const getPermissionLabel = (rights: string) => {
        const option = permissionOptions.find(opt => opt.value === rights);
        return option?.label || rights;
    };

    if (!document) return null;

    const hasNewPermissions = permissions.some(perm => perm.isNew);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <div>
                            <span>Document Permissions</span>
                            <p className="text-sm font-normal text-gray-500 mt-1">
                                {document.DOCUMENT_NO} - {document.DOCUMENT_DESCRIPTION}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Add New Permission
                        </h3>

                        {/* Top Row - 30%/70% split */}
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Left - User Select (30%) */}
                            <div className="w-full md:w-[40%]">
                                <Label className="block text-xs font-medium mb-1">User</Label>
                                <Select
                                    value={selectedUser}
                                    onValueChange={setSelectedUser}
                                    disabled={loadingUsers}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select user..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.USER_NAME} value={user.USER_NAME}>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span>{user.DISPLAY_NAME || user.USER_NAME}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Right - Permission Checkboxes (70%) */}
                            <div className="w-full md:w-[60%]">
                                <Label className="block text-xs font-medium mb-2">Permission Level</Label>
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                    {permissionOptions.map((option) => (
                                        <div key={option.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`permission-${option.value}`}
                                                checked={selectedPermission.includes(option.value)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedPermission([...selectedPermission, option.value]);
                                                    } else {
                                                        setSelectedPermission(selectedPermission.filter(p => p !== option.value));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`permission-${option.value}`}>
                                                <Badge className={option.color}>
                                                    {option.label}
                                                </Badge>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Left - Valid Till */}
                            <div className='w-full md:w-[35%]'>
                                <Label className="block text-xs font-medium mb-1">Valid Till</Label>
                                <Input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={validTill}
                                    onChange={(e) => setValidTill(e.target.value)}
                                />
                            </div>

                            {/* Right - Add Button */}
                            <div className=" className='w-full md:w-[65%]' flex items-end justify-end">
                                <Button
                                    onClick={addNewPermission}
                                    className="w-full md:w-auto text-white"
                                    disabled={loadingUsers || !selectedUser}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Permission
                                </Button>
                            </div>
                        </div>
                    </div>

                    {(loading || loadingUsers) && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-500">
                                {loadingUsers ? 'Loading users...' : 'Loading permissions...'}
                            </span>
                        </div>
                    )}

                    {!loading && !loadingUsers && (
                        <div className="space-y-4">
                            {permissions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No permissions set for this document</p>
                                </div>
                            ) : (
                                <div className="relative rounded-md border dark:border-gray-800">
                                    <div className="overflow-auto max-h-[300px]">
                                        <Table className="min-w-full">
                                            <TableHeader className="sticky top-0 bg-background z-10">
                                                <TableRow className="text-xs font-medium dark:border-gray-800">
                                                    <TableHead className="w-[20%] ">Users</TableHead>
                                                    <TableHead className="w-[15%]">Permission</TableHead>
                                                    <TableHead className="w-[20%]">Valid Till</TableHead>
                                                    <TableHead className="w-[20%]">Created On</TableHead>
                                                    <TableHead className="w-[5%] sticky right-0 bg-background z-20"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="text-xs font-medium">
                                                {permissions.map((permission) => (
                                                    <TableRow key={permission.id} className="dark:border-gray-800">
                                                        <TableCell className="w-[20%]">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-gray-400" />
                                                                <span>{permission.displayName}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="w-[15%]">
                                                            <div className="flex gap-1">
                                                                {permission.PERMISSION_RIGHTS.split(',').map(right => (
                                                                    <Badge
                                                                        key={right}
                                                                        className={getPermissionBadgeColor(right)}
                                                                    >
                                                                        {getPermissionLabel(right)}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="w-[20%]">
                                                            <div className="flex items-center gap-2">
                                                                {!permission.PERMISSION_VALID_TILL ||
                                                                    permission.PERMISSION_VALID_TILL === 'Invalid Date' ? (
                                                                    <span className="text-gray-500">No expiry</span>
                                                                ) : (
                                                                    <span className="text-red-500"
                                                                    >
                                                                        {convertServiceDatev1(permission.PERMISSION_VALID_TILL)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="w-[20%]">
                                                            <div className="flex items-center gap-2 text-green-500">
                                                                {convertServiceDatev1(permission.ENT_DATE)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="w-[5%] sticky right-0 bg-background z-10">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPermissionToDelete(permission);
                                                                    setShowDeleteConfirmation(true);
                                                                }}
                                                                className="p-1 h-auto"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showDeleteConfirmation && (
                    <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                Are you sure you want to remove permissions for {permissionToDelete?.displayName}?
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete Permission"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                <DialogFooter className="flex-shrink-0 pt-4 border-t">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !hasNewPermissions}
                        className="flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4" />
                                Save Permissions ({permissions.filter(p => p.isNew).length})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UserPermissionsDialog;