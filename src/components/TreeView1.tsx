import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FolderClosed, FolderOpen, ChevronRight, ChevronDown, Search, X, FileText, Download, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { callSoapService } from "@/api/callSoapService";
import { Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Input } from './ui';
import axios from 'axios';
import { getFileIcon } from '@/utils/getFileIcon';
import UserPermissionsDialog from './dialog/UserPermissionDialog';

// Type definitions
interface Document {
    DOCUMENT_NO?: string;
    DOCUMENT_DESCRIPTION?: string;
    DOC_RELATED_CATEGORY?: string;
    REF_SEQ_NO?: string | number;
    SERIAL_NO?: string | number;
    DOC_NAME?: string;
    DOC_EXT?: string;
    CREATED_DATE?: string;
    CREATED_BY?: string;
    DOC_TYPE?: string;
    [key: string]: any;
}

interface Category {
    id: string;
    name: string;
    type: string;
    children: Category[];
    count: number;
    originalData?: {
        CATEGORY_NAME?: string;
        DISPLAY_NAME?: string;
        MODULE_NAME?: string;
        [key: string]: any;
    };
}

interface Module {
    id: string;
    name: string;
    type: string;
    children: Category[];
    count: number;
}

interface DocumentDetails {
    REF_SEQ_NO?: string | number;
    SERIAL_NO?: string | number;
    DOC_NAME?: string;
    DOC_EXT?: string;
    [key: string]: any;
}

interface FileLoadingStates {
    [key: string]: string;
}

const TreeView1: React.FC = () => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [modules, setModules] = useState<Module[]>([]);
    const [filteredModules, setFilteredModules] = useState<Module[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedCategoryDocuments, setSelectedCategoryDocuments] = useState<Document[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [documentDetails, setDocumentDetails] = useState<DocumentDetails[] | null>(null);
    const [loadingDocumentDetails, setLoadingDocumentDetails] = useState<boolean>(false);
    const [fileLoadingStates, setFileLoadingStates] = useState<FileLoadingStates>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
    const [selectedDocumentForPermissions, setSelectedDocumentForPermissions] = useState<Document | null>(null);

    const { userData } = useAuth();

    useEffect(() => {
        fetchCategoryData();
    }, []);

    useEffect(() => {
        fetchAllDocuments();
    }, [userData]);

    useEffect(() => {
        filterData();
    }, [modules, searchTerm, selectedModule, documents]);

    useEffect(() => {
        if (selectedCategory) {
            const categoryDocs = getDocumentsForCategory(selectedCategory.originalData?.CATEGORY_NAME || '');
            setSelectedCategoryDocuments(categoryDocs);
        }
    }, [selectedCategory, documents]);

    const fetchCategoryData = async () => {
        try {
            const payload = {
                DataModelName: "SYNM_DMS_DOC_CATEGORIES",
                WhereCondition: "",
                Orderby: "",
            };

            const response = await callSoapService(
                userData?.clientURL || '',
                "DataModel_GetData",
                payload
            );

            let categories: any[] = [];
            if (Array.isArray(response)) {
                categories = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                categories = response.data;
            } else if (response && response.result && Array.isArray(response.result)) {
                categories = response.result;
            } else if (response && typeof response === 'object') {
                const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
                if (possibleArrays.length > 0) {
                    categories = possibleArrays[0];
                }
            }

            if (!Array.isArray(categories) || categories.length === 0) {
                console.warn("No valid category data found in response:", response);
                setModules([]);
                return;
            }

            const moduleMap: Record<string, Module> = {};

            categories.forEach((category: any) => {
                const moduleName = category.MODULE_NAME || 'Other Modules';
                const categoryName = category.CATEGORY_NAME;
                const pathForLan = category.PATH_FOR_LAN || `${categoryName}/`;

                // Create module if it doesn't exist
                if (!moduleMap[moduleName]) {
                    moduleMap[moduleName] = {
                        id: `module_${moduleName}`,
                        name: moduleName,
                        type: 'folder',
                        children: [],
                        count: 0
                    };
                }

                // Split path into parts
                const pathParts = pathForLan.split('/').filter(part => part.trim() !== '');

                // Find or create base category
                let currentParent = moduleMap[moduleName];
                let currentPath = '';

                pathParts.forEach((part, index) => {
                    currentPath += `${part}/`;
                    const isBaseCategory = index === 0;
                    const itemId = `category_${currentPath}_${moduleName}`;

                    let existingItem = currentParent.children.find(
                        child => child.name === part
                    );

                    if (!existingItem) {
                        const newItem: Category = {
                            id: itemId,
                            name: part,
                            type: 'folder',
                            originalData: isBaseCategory ? category : {
                                ...category,
                                CATEGORY_NAME: part,
                                PATH_FOR_LAN: currentPath
                            },
                            count: 0,
                            children: []
                        };

                        currentParent.children.push(newItem);
                        currentParent = newItem;
                    } else {
                        currentParent = existingItem;
                    }
                });
            });

            setModules(Object.values(moduleMap));
        } catch (error) {
            setError((error as Error)?.message || "Failed to fetch category data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllDocuments = useCallback(async () => {
        if (!userData || !userData.clientURL) {
            console.warn("User data not available yet.");
            return;
        }

        try {
            setError(null);

            const payload = {
                WhereCondition: "",
                Orderby: "REF_SEQ_NO DESC",
                IncludeEmpImage: false,
            };

            const response = await callSoapService(
                userData.clientURL,
                "DMS_GetDocMaster_List",
                payload
            );

            let documentsData: Document[] = [];
            if (Array.isArray(response)) {
                documentsData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                documentsData = response.data;
            } else if (response && response.result && Array.isArray(response.result)) {
                documentsData = response.result;
            } else if (response && typeof response === 'object') {
                const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
                if (possibleArrays.length > 0) {
                    documentsData = possibleArrays[0];
                }
            }

            if (!Array.isArray(documentsData)) {
                console.warn("No valid documents data found in response:", response);
                setDocuments([]);
                return;
            }

            setDocuments(documentsData);
        } catch (err) {
            console.error("Error fetching documents:", err);
            setError((err as Error).message || "Error fetching documents.");
        }
    }, [userData]);

    const fetchDocumentDetails = async (refSeqNo: string | number) => {
        if (!userData || !userData.clientURL) {
            console.warn("User data not available yet.");
            return;
        }

        try {
            setLoadingDocumentDetails(true);
            setError(null);

            const payload = {
                DataModelName: "synmview_dms_details_all",
                WhereCondition: `REF_SEQ_NO = ${refSeqNo}`,
                Orderby: "",
            };

            const response = await callSoapService(
                userData.clientURL,
                "DataModel_GetData",
                payload
            );

            let detailsData: DocumentDetails[] = [];
            if (Array.isArray(response)) {
                detailsData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                detailsData = response.data;
            } else if (response && response.result && Array.isArray(response.result)) {
                detailsData = response.result;
            } else if (response && typeof response === 'object') {
                const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
                if (possibleArrays.length > 0) {
                    detailsData = possibleArrays[0];
                }
            }

            if (Array.isArray(detailsData) && detailsData.length > 0) {
                setDocumentDetails(detailsData);
            } else {
                console.warn("No document details found for REF_SEQ_NO:", refSeqNo);
                setDocumentDetails(null);
            }
        } catch (err) {
            console.error("Error fetching document details:", err);
            setError((err as Error).message || "Error fetching document details.");
            setDocumentDetails(null);
        } finally {
            setLoadingDocumentDetails(false);
        }
    };

    const getDocumentsForCategory = useCallback((categoryName: string): Document[] => {
        return documents.filter(doc =>
            doc.DOC_RELATED_CATEGORY === categoryName
        );
    }, [documents]);

    const buildModulesWithDocuments = useMemo(() => {
        return modules.map(module => {
            // Calculate total documents for all categories in this module
            const totalDocuments = module.children.reduce((sum, category) => {
                const categoryDocs = getDocumentsForCategory(category.originalData?.CATEGORY_NAME || '');
                return sum + categoryDocs.length;
            }, 0);

            return {
                ...module,
                count: totalDocuments, // Set module count to total documents of all its categories
                children: module.children.map(category => {
                    const categoryDocs = getDocumentsForCategory(category.originalData?.CATEGORY_NAME || '');
                    return {
                        ...category,
                        count: categoryDocs.length // Keep category count as is
                    };
                })
            };
        });
    }, [modules, documents, getDocumentsForCategory]);

    const filterData = () => {
        let filtered = [...buildModulesWithDocuments];

        if (selectedModule !== 'all') {
            filtered = filtered.filter(module => module.name === selectedModule);
        }

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.map(module => {
                const filteredChildren = module.children.filter(category => {
                    const categoryMatches = category.name.toLowerCase().includes(searchLower) ||
                        category.originalData?.CATEGORY_NAME?.toLowerCase().includes(searchLower);

                    const documentsMatch = getDocumentsForCategory(category.originalData?.CATEGORY_NAME || '').some(doc =>
                        doc.DOCUMENT_NO?.toLowerCase().includes(searchLower) ||
                        doc.DOCUMENT_DESCRIPTION?.toLowerCase().includes(searchLower)
                    );

                    return categoryMatches || documentsMatch;
                });

                return {
                    ...module,
                    children: filteredChildren
                };
            }).filter(module => module.children.length > 0);
        }

        setFilteredModules(filtered);
    };

    const toggle = (id: string) => {
        const newExpanded = new Set();

        if (!expanded.has(id)) {
            newExpanded.add(id);
        }

        setExpanded(newExpanded);
        setSelectedCategory(null);
        setSelectedCategoryDocuments([]);
        setSelectedDocument(null);
        setDocumentDetails(null);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const getTotalCounts = () => {
        const totalModules = buildModulesWithDocuments.length;
        const totalCategories = buildModulesWithDocuments.reduce((sum, module) => sum + module.children.length, 0);
        const totalDocuments = documents.length;
        return { totalModules, totalCategories, totalDocuments };
    };

    const getUniqueModules = () => {
        return [...new Set(buildModulesWithDocuments.map(module => module.name))];
    };

    const handleCategoryClick = (category: Category) => {
        console.log("Category clicked:", category);
        setSelectedCategory(category);
        setSelectedDocument(null);
        setDocumentDetails(null);

        const pathForLan = category.originalData?.PATH_FOR_LAN ||
            `${category.originalData?.CATEGORY_NAME || category.name}/`;

        const categoryDocs = documents.filter(doc => {
            const docPath = doc.PATH_FOR_LAN || `${doc.DOC_RELATED_CATEGORY}/`;
            return docPath.startsWith(pathForLan);
        });

        setSelectedCategoryDocuments(categoryDocs);
    };

    const handleDocumentClick = async (document: Document) => {
        // Only proceed if we're not already showing permissions dialog
        if (!permissionsDialogOpen) {
            console.log("Document clicked:", document);
            setSelectedDocument(document);

            if (document.REF_SEQ_NO) {
                await fetchDocumentDetails(document.REF_SEQ_NO);
            }
        }
    };

    const handleBackToCategory = () => {
        setSelectedDocument(null);
        setDocumentDetails(null);
    };

    const handleViewDocs = async (selectedDocs: DocumentDetails) => {
        if (!userData?.userEmail || !selectedDocs.REF_SEQ_NO || !selectedDocs.DOC_NAME) return;

        const fileKey = `${selectedDocs.REF_SEQ_NO}-${selectedDocs.SERIAL_NO}`;
        setFileLoadingStates(prev => ({
            ...prev,
            [fileKey]: 'view'
        }));

        try {
            const downloadUrl = `https://apps.istreams-erp.com:4440/api/megacloud/download?email=${encodeURIComponent(userData.userEmail)}&refNo=${encodeURIComponent(selectedDocs.REF_SEQ_NO)}&fileName=${selectedDocs.DOC_NAME}`;
            const response = await axios.get(downloadUrl, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'application/octet-stream',
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', selectedDocs.DOC_NAME || `document_${selectedDocs.REF_SEQ_NO}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error downloading document:", err);
            alert("Failed to download the document. Please try again.");
        } finally {
            setFileLoadingStates(prev => {
                const newState = { ...prev };
                delete newState[fileKey];
                return newState;
            });
        }
    };

    const renderItem = (item: Category | Module, level = 0) => {
        const isExpanded = expanded.has(item.id);
        const hasChildren = item.children?.length > 0;
        const isModule = level === 0;
        const isCategory = level === 1;
        const isSubfolder = level > 1;
        const showBadge = item.count > 0;

        return (
            <div key={item.id} className="select-none">
                <div
                    className={`flex items-center py-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${selectedCategory?.id === item.id ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-600' : ''
                        }`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={() => {
                        if (isModule) {
                            toggle(item.id); // Keep module expansion
                        } else if (isCategory) {
                            // Toggle expansion for categories only (no chevron)
                            const newExpanded = new Set(expanded);
                            if (newExpanded.has(item.id)) {
                                newExpanded.delete(item.id);
                            } else {
                                newExpanded.add(item.id);
                            }
                            setExpanded(newExpanded);
                            handleCategoryClick(item as Category);
                        } else if (isSubfolder) {
                            handleCategoryClick(item as Category);
                        }
                    }}
                >
                    {/* Chevron only for modules */}
                    {isModule && hasChildren && (
                        <div className="w-6 h-6 mr-1 flex items-center justify-center">
                            {isExpanded ?
                                <ChevronDown className="w-4 h-4" /> :
                                <ChevronRight className="w-4 h-4" />
                            }
                        </div>
                    )}

                    {/* Folder icons */}
                    <div className="mr-2 flex items-center">
                        {isModule ? (
                            isExpanded ?
                                <FolderOpen className="w-4 h-4 text-blue-500" /> :
                                <FolderClosed className="w-4 h-4 text-blue-500" />
                        ) : isCategory ? (
                            isExpanded ?
                                <FolderOpen className="w-4 h-4 text-green-500" /> :
                                <FolderClosed className="w-4 h-4 text-green-500" />
                        ) : (
                            isExpanded ?
                                <FolderOpen className="w-4 h-4 text-yellow-500" /> :
                                <FolderClosed className="w-4 h-4 text-yellow-500" />
                        )}
                    </div>

                    <span className="text-sm truncate flex-1 font-medium">
                        {item.name}
                        {/* {isSubfolder && (
                            <span className="text-xs text-gray-500 ml-2">(subfolder)</span>
                        )} */}
                    </span>

                    {showBadge && (
                        <Badge variant="secondary" className="ml-2">
                            {item.count}
                        </Badge>
                    )}
                </div>

                {/* Show children if:
                - It's a module and expanded, OR
                - It's a category and expanded */}
                {((isModule && isExpanded) || (isCategory && isExpanded)) && hasChildren && (
                    <div>{item.children.map(child => renderItem(child, level + 1))}</div>
                )}
            </div>
        );
    };

    const renderDocumentCard = (document: Document, index: number) => (
        <div
            key={`${document.DOCUMENT_NO}_${index}`}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleDocumentClick(document)}
        >
            <div className="flex items-start justify-between mb-3">
                {/* Left Section */}
                <div className="flex items-center">
                    <FileText className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {document.DOCUMENT_NO}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {document.DOCUMENT_DESCRIPTION || 'No Description'}
                        </p>
                    </div>
                </div>

                {/* Right Section - Icon Button */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDocumentForPermissions(document);
                        setPermissionsDialogOpen(true);
                    }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                    title="Set Permissions"
                >
                    <ShieldCheck className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                </div>
            </div>
        </div>
    );

    const renderDocumentDetails = () => {
        if (loadingDocumentDetails) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading document details...</p>
                    </div>
                </div>
            );
        }

        if (!documentDetails || documentDetails.length === 0) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-500 mb-2">No Details Found</h2>
                        <p className="text-sm text-gray-400">Unable to load document details</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-wrap gap-2 mt-4">
                {documentDetails.map((doc, index) => {
                    const fileKey = `${doc.REF_SEQ_NO}-${doc.SERIAL_NO}`;
                    const isLoading = fileLoadingStates[fileKey] === 'view';
                    const docExtension = doc.DOC_EXT || doc.DOC_NAME?.split('.').pop() || '';

                    return (
                        <div
                            key={`${doc.REF_SEQ_NO}-${index}`}
                            className="w-72"
                        >
                            <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="card-body p-4">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg">
                                                <img
                                                    src={getFileIcon(docExtension)}
                                                    alt="Document"
                                                    className="w-6 h-6"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1 overflow-hidden">
                                                <h5
                                                    className="text-sm font-semibold truncate text-gray-800 dark:text-gray-300"
                                                >
                                                    {doc.DOC_NAME && doc.DOC_NAME.length > 24
                                                        ? doc.DOC_NAME.slice(0, 24) + "..."
                                                        : doc.DOC_NAME}
                                                </h5>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 items-center">
                                            <button
                                                onClick={() => handleViewDocs(doc)}
                                                title="View"
                                                disabled={isLoading}
                                                className="p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                                            >
                                                {isLoading ? (
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-2 text-center text-gray-500">
                Loading document categories...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-2 text-center text-red-500">
                Error: {error}
            </div>
        );
    }

    const { totalModules, totalCategories, totalDocuments } = getTotalCounts();
    const uniqueModules = getUniqueModules();

    return (
        <div className="w-full h-screen flex flex-col">
            <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                Modules: <Badge variant="outline">{totalModules}</Badge>
                            </span>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                Categories: <Badge variant="outline">{totalCategories}</Badge>
                            </span>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                Documents: <Badge variant="outline">{totalDocuments}</Badge>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:mt-0">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search Categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-48 pl-10 pr-10 border-gray-600 dark:border-gray-400"
                            />
                            {searchTerm && (
                                <Button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 p-0"
                                    variant="ghost"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        <Select value={selectedModule} onValueChange={setSelectedModule}>
                            <SelectTrigger className="w-full sm:w-48 border-gray-600 dark:border-gray-400">
                                <SelectValue placeholder="All Modules" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modules ({totalModules})</SelectItem>
                                {uniqueModules.map(moduleName => {
                                    const moduleData = buildModulesWithDocuments.find(m => m.name === moduleName);
                                    return (
                                        <SelectItem key={moduleName} value={moduleName}>
                                            {moduleName} ({moduleData?.count || 0})
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row h-[88vh]">
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-600 overflow-y-auto p-2 h-[44vh] md:h-full">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Categories</h2>
                    {filteredModules.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">
                            {searchTerm || selectedModule !== 'all' ? 'No matching categories found' : 'No modules found'}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredModules.map(module => (
                                <div key={module.id}>
                                    {renderItem(module)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 h-[44vh] md:h-full">
                    {selectedDocument ? (
                        <div>
                            <div className="mb-6 flex items-center">
                                <Button
                                    onClick={handleBackToCategory}
                                    variant="ghost"
                                    size="sm"
                                    className="mr-4"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                </Button>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedDocument.DOCUMENT_NO}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        REF_SEQ_NO: {selectedDocument.REF_SEQ_NO}
                                    </p>
                                </div>
                            </div>
                            {renderDocumentDetails()}
                        </div>
                    ) : selectedCategory ? (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    {selectedCategory.name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Click on a document to view its details
                                </p>
                            </div>

                            {selectedCategoryDocuments.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-lg text-gray-500">No documents found in this category</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {selectedCategoryDocuments.map((document, index) =>
                                        renderDocumentCard(document, index)
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <FolderClosed className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-gray-500 mb-2">Select a Category</h2>
                                <p className="text-sm text-gray-400">Choose a category from the left panel to view its documents</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {permissionsDialogOpen && (
                <UserPermissionsDialog
                    isOpen={permissionsDialogOpen}
                    onClose={() => {
                        setPermissionsDialogOpen(false);
                        setSelectedDocumentForPermissions(null);
                    }}
                    document={selectedDocumentForPermissions}
                />
            )}
        </div>
    );
};

export default TreeView1;