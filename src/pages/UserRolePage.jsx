import AccessDenied from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { callSoapService } from "@/api/callSoapService";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { AlertTriangle, Check, ChevronsUpDown, Edit, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export const UserRolePage = () => {
  const [roleDetails, setRoleDetails] = useState({ ROLE_NAME: "", ROLE_ID: "New", ROLE_DESCRIPTION: "" });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openRolePopover, setOpenRolePopover] = useState(false);
  const [roleSearchInput, setRoleSearchInput] = useState("");
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [isNewRole, setIsNewRole] = useState(false);
  const [isRoleSaved, setIsRoleSaved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalRoleName, setOriginalRoleName] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { userData } = useAuth();

  useEffect(() => {
    if (!hasFetchedUsers && userData.clientURL) {
      fetchRolesData();
      fetchUsersData();
      setHasFetchedUsers(true);
    }
  }, [userData.clientURL, hasFetchedUsers]);

  const fetchRolesData = async () => {
    setLoadingRoles(true);
    try {
      const payload = {
        DataModelName: "general_roles_master",
        WhereCondition: "",
        Orderby: "ROLE_ID",
      };

      const response = await callSoapService(userData.clientURL, "DataModel_GetData", payload);

      const formattedRoles = response.map((role) => ({
        ROLE_NAME: role.ROLE_NAME?.trim(),
        ROLE_ID: role.ROLE_ID.toString(),
        ROLE_DESCRIPTION: role.ROLE_DESCRIPTION || "",
      }));

      setRolesList(formattedRoles);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching roles",
        description: error.message,
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchUsersForRole = async (ROLE_ID) => {
    setLoadingUsers(true);
    try {
      const payload = {
        DataModelName: "general_roles_users",
        WhereCondition: `ROLE_ID = '${ROLE_ID}'`,
        Orderby: "USER_NAME",
      };

      const response = await callSoapService(userData.clientURL, "DataModel_GetData", payload);

      const usersArray = Array.isArray(response) ? response : response?.data || [];
      const formattedUsers = usersArray.map((user) => ({
        id: user.USER_NAME, // Using USER_NAME as ID for consistency
        name: user.USER_NAME?.trim() || `User`,
      }));

      setSelectedUsers(formattedUsers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching users for role",
        description: error.message || "Failed to fetch users",
      });
      setSelectedUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUsersData = async () => {
    setLoadingUsers(true);
    try {
      const payload = {
        DataModelName: "user_master",
        WhereCondition: "",
        Orderby: "USER_NAME",
      };

      const response = await callSoapService(userData.clientURL, "DataModel_GetData", payload);

      const usersArray = Array.isArray(response) ? response : response?.data || [];
      const formattedUsers = usersArray.map((user) => ({ id: user.USER_NAME, name: user.USER_NAME?.trim() || `User` }));

      setUsersList(formattedUsers);
    } catch (error) {
      setUsersList([]);
      toast({
        variant: "destructive",
        title: "Error fetching users data",
        description: error.message || "Failed to fetch users",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleSelect = (role) => {
    setRoleDetails({ ROLE_NAME: role.ROLE_NAME, ROLE_ID: role.ROLE_ID, ROLE_DESCRIPTION: role.ROLE_DESCRIPTION || "" });
    setOriginalRoleName(role.ROLE_NAME);
    setIsRoleSaved(role.ROLE_ID !== "New");
    setIsNewRole(role.ROLE_ID === "New");
    setIsEditMode(false);
    setSelectedUsers([]);

    if (role.ROLE_ID !== "New") {
      fetchUsersForRole(role.ROLE_ID);
    } else {
      setSelectedUsers([]);
    }
    setOpenRolePopover(false);
  };

  const handleUserSelect = useCallback((user) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoleDetails((prev) => {
      const newDetails = { ...prev, [name]: value };
      if (!isEditMode && (name === "ROLE_DESCRIPTION" || name === "ROLE_NAME")) {
        setIsRoleSaved(false);
      }
      return newDetails;
    });
  };

  const enableEditMode = () => {
    setIsEditMode(true);
    setIsRoleSaved(false);
  };

  const cancelEdit = () => {
    // Reset to original values
    const originalRole = rolesList.find((role) => role.ROLE_ID === roleDetails.ROLE_ID);
    if (originalRole) {
      setRoleDetails({ ROLE_ID: originalRole.ROLE_ID, ROLE_NAME: originalRole.ROLE_NAME, ROLE_DESCRIPTION: originalRole.ROLE_DESCRIPTION });
    }
    setIsEditMode(false);
    setIsRoleSaved(true);
  };

  const showDeleteConfirmation = (role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const hideDeleteConfirmation = () => {
    setShowDeleteConfirm(false);
    setRoleToDelete(null);
  };

  const handleDelete = async (role) => {
    setIsDeleting(true);
    try {
      const deleteUsersPayload = {
        UserName: userData.currentUserLogin,
        DataModelName: "general_roles_users",
        WhereCondition: `ROLE_ID = '${role.ROLE_ID}'`,
      };

      await callSoapService(userData.clientURL, "DataModel_DeleteData", deleteUsersPayload);

      const deleteRolePayLoad = {
        UserName: userData.currentUserLogin,
        DataModelName: "general_roles_master",
        WhereCondition: `ROLE_ID = '${role.ROLE_ID}'`,
      };

      const deleteResponse = await callSoapService(userData.clientURL, "DataModel_DeleteData", deleteRolePayLoad);

      setRolesList((prev) => prev.filter((r) => r.ROLE_ID !== role.ROLE_ID));
      setSavedConfigs((prev) => prev.filter((config) => config.role.ROLE_ID !== role.ROLE_ID));

      if (roleDetails.ROLE_ID === role.ROLE_ID) {
        setRoleDetails({ ROLE_NAME: "", ROLE_ID: "NEW", ROLE_DESCRIPTION: "" });
        setSelectedUsers([]);
        setIsRoleSaved(false);
        setIsNewRole(false);
        setIsEditMode(false);
      }

      toast({ title: "Role deleted successfully", description: deleteResponse || "Role and associated users have been removed", duration: 2000 });
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting role", description: error.message || "Failed to delete role" });
    } finally {
      setIsDeleting(false);
      hideDeleteConfirmation();
    }
  };

  const toTitleCase = (str) => {
    if (!str) return "";
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const handleSaveRoleDetails = async () => {
    if (!roleDetails.ROLE_NAME.trim()) {
      toast({ title: "Role name is required", variant: "destructive" });
      return;
    }

    if (!roleDetails.ROLE_DESCRIPTION.trim()) {
      toast({ title: "Role description is required", variant: "destructive" });
      return;
    }

    if (isNewRole) {
      const roleExists = rolesList.some((role) => role.ROLE_NAME.toLowerCase() === roleDetails.ROLE_NAME.toLowerCase());

      if (roleExists) {
        toast({
          title: "Role already exists",
          description: "Please choose a different role name",
          variant: "destructive",
        });
        return;
      }
    }

    // For edit mode, check if another role with same name exists (not counting the current role)
    if (isEditMode) {
      const roleExists = rolesList.some(
        (role) => role.ROLE_NAME.toLowerCase() === roleDetails.ROLE_NAME.toLowerCase() && role.ROLE_ID !== roleDetails.ROLE_ID,
      );

      if (roleExists) {
        toast({
          title: "Role name already taken",
          description: "Please choose a different role name",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const roleFormData = {
        ROLE_ID: isNewRole ? -1 : roleDetails.ROLE_ID, // -1 for new, existing ID for edit
        ROLE_NAME: roleDetails.ROLE_NAME,
        ROLE_DESCRIPTION: roleDetails.ROLE_DESCRIPTION,
        USER_NAME: userData.currentUserName,
        ENT_DATE: "",
      };

      const convertedDataModel = convertDataModelToStringData("general_roles_master", roleFormData);

      const roleSavePayload = { UserName: userData.currentUserLogin, DModelData: convertedDataModel };

      const saveResponse = await callSoapService(userData.clientURL, "DataModel_SaveData", roleSavePayload);

      let newRoleId = roleDetails.ROLE_ID;

      // Update UI state
      if (isNewRole) {
        try {
          if (typeof saveResponse === "string" && saveResponse.includes("ID:")) {
            const idMatch = saveResponse.match(/ID:\s*(\d+)/i);
            if (idMatch && idMatch[1]) {
              newRoleId = idMatch[1];
            }
          }
        } catch (error) {
          // Silently handle parsing error
        }

        if (newRoleId === "New" || newRoleId === -1 || !newRoleId) {
          const existingIds = rolesList.map((role) => parseInt(role.ROLE_ID)).filter((id) => !isNaN(id));
          const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
          newRoleId = (maxId + 1).toString();
        }

        const newRole = { ROLE_NAME: roleDetails.ROLE_NAME, ROLE_ID: newRoleId, ROLE_DESCRIPTION: roleDetails.ROLE_DESCRIPTION };

        setRolesList((prev) => [...prev, newRole]);
      } else if (isEditMode) {
        // Update the local state for edited role
        setRolesList((prev) =>
          prev.map((role) =>
            role.ROLE_ID === roleDetails.ROLE_ID
              ? { ...role, ROLE_NAME: roleDetails.ROLE_NAME, ROLE_DESCRIPTION: roleDetails.ROLE_DESCRIPTION }
              : role,
          ),
        );

        // Update saved configs to reflect the name change
        setSavedConfigs((prev) =>
          prev.map((config) =>
            config.role.ROLE_ID === roleDetails.ROLE_ID
              ? { ...config, role: { ...config.role, ROLE_NAME: roleDetails.ROLE_NAME, ROLE_DESCRIPTION: roleDetails.ROLE_DESCRIPTION } }
              : config,
          ),
        );
      }

      setRoleDetails((prev) => ({ ...prev, ROLE_ID: newRoleId }));
      setIsRoleSaved(true);
      setIsNewRole(false);
      setIsEditMode(false);
      setOriginalRoleName(roleDetails.ROLE_NAME);

      toast({
        title: isEditMode ? "Role details updated successfully" : "Role details saved successfully",
        description: saveResponse || `Changes have been saved to the database`,
        duration: 1500,
      });

      fetchRolesData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: isEditMode ? "Error updating role details" : "Error saving role details",
        description: error.message || "Please try again.",
      });
    }
  };

  const handleSave = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const user of selectedUsers) {
        const userRoleData = { ROLE_ID: roleDetails.ROLE_ID, USER_NAME: user.name, IS_ACTIVE: "T" };

        const data = convertDataModelToStringData("general_roles_users", userRoleData);

        const savePayload = { UserName: userData.currentUserLogin, DModelData: data };


        const saveResponse = await callSoapService(userData.clientURL, "DataModel_SaveData", savePayload);

        if (saveResponse === null || saveResponse === undefined || (typeof saveResponse === "object" && saveResponse.error)) {
          throw new Error(`Failed to save user ${user.name} to role ${roleDetails.ROLE_NAME}`);
        }
      }

      const config = { role: roleDetails, users: selectedUsers.map((user) => ({ name: user.name })) };

      setSavedConfigs((prev) => [...prev, config]);

      toast({ title: "Success", description: `Saved ${selectedUsers.length} user(s) to role ${roleDetails.ROLE_NAME}`, duration: 2000 });
    } catch (error) {
      console.error("Save error:", error);
      toast({ variant: "destructive", title: "Save failed", description: error.message || "Failed to save user-role mappings" });
    }
  };

  const handleUserDelete = async (userId, userName) => {
    try {
      if (roleDetails.ROLE_ID !== "New") {
        const deletePayload = {
          UserName: userData.currentUserLogin,
          DataModelName: "general_roles_users",
          WhereCondition: `ROLE_ID = '${roleDetails.ROLE_ID}' AND USER_NAME = '${userName}'`,
        };

        await callSoapService(userData.clientURL, "DataModel_DeleteData", deletePayload);
      }

      // Update UI state
      setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));

      setSavedConfigs((prev) =>
        prev.map((config) => {
          if (config.role.ROLE_ID === roleDetails.ROLE_ID) {
            return {
              ...config,
              users: config.users.filter((u) => u.name !== userName),
            };
          }
          return config;
        }),
      );

      toast({
        title: "User removed",
        description: `User ${userName} has been removed from role ${roleDetails.ROLE_NAME}`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error removing user",
        description: error.message || "Failed to remove user from role",
      });
    }
  };

  const canSaveConfiguration = isRoleSaved && selectedUsers.length > 0;

     if (!userData?.isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Role Details */}
        <Card className="border">
          <CardTitle className="pl-4 pt-2 text-lg font-semibold">Role Details</CardTitle>

          <CardContent className="h-[180px] space-y-0">
            <div className="grid grid-cols-1 grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ROLE_ID">Role ID</Label>
                <Input
                  name="ROLE_ID"
                  value={roleDetails.ROLE_ID}
                  disabled
                />
              </div>

              <div>
                <Label>Select Role Name</Label>
                {isEditMode ? (
                  <Input
                    name="ROLE_NAME"
                    value={roleDetails.ROLE_NAME}
                    onChange={handleInputChange}
                    placeholder="Enter role name"
                  />
                ) : (
                  <Popover
                    open={openRolePopover}
                    onOpenChange={setOpenRolePopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between text-left font-normal"
                      >
                        {roleDetails.ROLE_NAME || "Select role name"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="z-50 h-[200px] w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search role name"
                          value={roleSearchInput}
                          onValueChange={setRoleSearchInput}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="flex items-center justify-between px-2">
                              <span>No role found.</span>
                              {roleSearchInput && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const newRole = toTitleCase(roleSearchInput.trim());
                                    setRoleDetails({ ROLE_NAME: newRole, ROLE_ID: "New", ROLE_DESCRIPTION: "" });
                                    setIsNewRole(true);
                                    setOpenRolePopover(false);
                                  }}
                                >
                                  Add "{roleSearchInput}"
                                </Button>
                              )}
                            </div>
                          </CommandEmpty>

                          <CommandGroup>
                            {loadingRoles ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">Loading roles...</div>
                            ) : (
                              rolesList.map((role) => (
                                <CommandItem
                                  key={`role-${role.ROLE_ID}`}
                                  value={role.ROLE_NAME}
                                  onSelect={() => handleRoleSelect(role)}
                                >
                                  {role.ROLE_NAME}
                                  <Check className={cn("ml-auto h-4 w-4", roleDetails.ROLE_NAME === role.ROLE_NAME ? "opacity-100" : "opacity-0")} />
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="ROLE_DESCRIPTION">Description</Label>
              <Textarea
                name="ROLE_DESCRIPTION"
                value={roleDetails.ROLE_DESCRIPTION}
                onChange={handleInputChange}
                placeholder="Enter role description"
                className="min-h-[60px]"
              />
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            {!isEditMode && isRoleSaved && roleDetails.ROLE_ID !== "New" && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => showDeleteConfirmation(roleDetails)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
                <Button
                  variant="outline"
                  onClick={enableEditMode}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Role
                </Button>
              </>
            )}

            {isEditMode && (
              <Button
                variant="outline"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            )}

            {(!isRoleSaved || isNewRole || isEditMode) && (
              <Button
                onClick={handleSaveRoleDetails}
                disabled={!roleDetails.ROLE_NAME || !roleDetails.ROLE_DESCRIPTION}
              >
                {isEditMode ? "Update" : "Save"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Select Users */}
        <Card className={cn("border", !isRoleSaved && "pointer-events-none opacity-50")}>
          <CardTitle className="mb-2 pl-4 pt-2 text-lg font-semibold">Select Users</CardTitle>

          <CardContent className="h-[380px] space-y-0 pl-4 pr-4">
            {!isRoleSaved && <div className="mb-4 text-sm text-muted-foreground">Please save the Role Details first to enable this section.</div>}

            {/* Top Section - Search and Selection */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row">
              {/* Left Side - User Selection Popover */}
              <div className="w-full md:w-1/2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left"
                    >
                      {selectedUsers.length > 0 ? `${selectedUsers.length} user(s) selected` : "Select users"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-50 h-[200px] w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandList>
                        <CommandGroup>
                          {loadingUsers ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">Loading users...</div>
                          ) : (
                            usersList.map((user) => (
                              <CommandItem
                                key={`${user.id}`}
                                onSelect={() => handleUserSelect(user)}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span>{user.name}</span>
                                  {selectedUsers.some((u) => u.id === user.id) && <Check className="h-4 w-4 text-primary" />}
                                </div>
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Right Side - Search Box (filters table) */}
              <div className="relative w-full sm:w-[200px] md:w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder="Search Users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 font-medium"
                />
              </div>
            </div>

            {/* Bottom Section - Selected Users Table */}
            {selectedUsers.length > 0 ? (
              <div className="h-[calc(380px-100px)] rounded-md border dark:border-gray-800">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow className="text-xs font-medium dark:border-gray-800">
                        <TableHead className="w-[70%]">Name</TableHead>
                        <TableHead className="w-[30%] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs font-medium">
                      {selectedUsers
                        .filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((user) => (
                          <TableRow
                            key={user.id}
                            className="dark:border-gray-800"
                          >
                            <TableCell className="max-w-[180px] truncate">{user.name}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUserDelete(user.id, user.name)}
                                className="ml-auto"
                              >
                                <Trash2 className="text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex h-[calc(380px-100px)] items-center justify-center rounded-md border">
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No users selected yet. Select users from above to display them here.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        {canSaveConfiguration && (
          <Button
            onClick={() => {
              handleSave();
              // Reset form after successful save
              setRoleDetails({ ROLE_NAME: "", ROLE_ID: "New", ROLE_DESCRIPTION: "" });
              setSelectedUsers([]);
              setIsRoleSaved(false);
              setIsNewRole(false);
              setIsEditMode(false);
            }}
          >
            Save Configuration
          </Button>
        )}
      </div>

      <div>
        {/* ConfigurationTable */}
        {savedConfigs.length > 0 && (
          <div>
            <Label className="text-lg font-semibold">Saved Configurations</Label>

            <div className="h-[120px] space-y-0 p-2">
              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs font-medium">
                      <TableHead>Role Name</TableHead>
                      <TableHead>Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs font-medium">
                    {savedConfigs.map((config, index) => (
                      <TableRow key={`${config.role.ROLE_ID}-${index}`}>
                        <TableCell className="max-w-[220px] truncate">{config.role.ROLE_NAME}</TableCell>
                        <TableCell>{config.users.map((user) => user.name).join(", ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold">Delete Role</h3>
            </div>

            <p className="mb-6 text-sm text-gray-600">Are you sure you want to delete the role "{roleToDelete?.ROLE_NAME}"?</p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={hideDeleteConfirmation}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => roleToDelete && handleDelete(roleToDelete)}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? "Deleting..." : "Delete Role"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};