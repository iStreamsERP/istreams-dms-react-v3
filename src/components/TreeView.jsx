import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, Search, X, FileText, Calendar, User, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { callSoapService } from "@/api/callSoapService";
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import axios from 'axios';

const TreeView = () => {
    const [expanded, setExpanded] = useState(new Set());
    const [modules, setModules] = useState([]);
    const [filteredModules, setFilteredModules] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryDocuments, setSelectedCategoryDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentDetails, setDocumentDetails] = useState(null);
    const [loadingDocumentDetails, setLoadingDocumentDetails] = useState(false);
    const [fileLoadingStates, setFileLoadingStates] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState('all');
    const { userData, userViewRights } = useAuth();

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
            const categoryDocs = getDocumentsForCategory(selectedCategory.originalData?.CATEGORY_NAME);
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
                userData.clientURL,
                "DataModel_GetData",
                payload
            );

            //console.log("Category API Response:", response);

            let categories = [];
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

            const moduleMap = {};
            const categoryCountMap = {};

            categories.forEach(category => {
                const moduleName = category.MODULE_NAME || 'Other Modules';
                const categoryName = category.CATEGORY_NAME;

                if (!categoryCountMap[categoryName]) {
                    categoryCountMap[categoryName] = 0;
                }
                categoryCountMap[categoryName]++;

                if (!moduleMap[moduleName]) {
                    moduleMap[moduleName] = {
                        id: `module_${moduleName}`,
                        name: moduleName,
                        type: 'folder',
                        children: [],
                        count: 0
                    };
                }

                const existingCategory = moduleMap[moduleName].children.find(
                    child => child.originalData?.CATEGORY_NAME === categoryName
                );

                if (!existingCategory) {
                    moduleMap[moduleName].children.push({
                        id: `category_${categoryName}_${moduleName}`,
                        name: category.DISPLAY_NAME || categoryName,
                        type: 'folder',
                        originalData: category,
                        count: 0,
                        children: []
                    });
                    moduleMap[moduleName].count++;
                }
            });

            setModules(Object.values(moduleMap));
        } catch (error) {
            setError(error?.message || "Failed to fetch category data");
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

            //console.log("Documents Response:", response);

            let documentsData = [];
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
            //console.log("Fetched documents:", documentsData.length);

        } catch (err) {
            console.error("Error fetching documents:", err);
            setError(err.message || "Error fetching documents.");
        }
    }, [userData]);

    const fetchDocumentDetails = async (refSeqNo) => {
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

            console.log("Document Details Response:", response);

            let detailsData = [];
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
                // Set all documents instead of just the first one
                setDocumentDetails(detailsData);
                console.log("Document details fetched:", detailsData);
            } else {
                console.warn("No document details found for REF_SEQ_NO:", refSeqNo);
                setDocumentDetails(null);
            }

        } catch (err) {
            console.error("Error fetching document details:", err);
            setError(err.message || "Error fetching document details.");
            setDocumentDetails(null);
        } finally {
            setLoadingDocumentDetails(false);
        }
    };

    const getDocumentsForCategory = useCallback((categoryName) => {
        return documents.filter(doc =>
            doc.DOC_RELATED_CATEGORY === categoryName
        );
    }, [documents]);

    const buildModulesWithDocuments = useMemo(() => {
        return modules.map(module => ({
            ...module,
            children: module.children.map(category => {
                const categoryDocs = getDocumentsForCategory(category.originalData?.CATEGORY_NAME);
                return {
                    ...category,
                    count: categoryDocs.length
                };
            })
        }));
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

                    const documentsMatch = getDocumentsForCategory(category.originalData?.CATEGORY_NAME).some(doc =>
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

    // Updated toggle function for accordion behavior
    const toggle = (id) => {
        const newExpanded = new Set();

        // If the clicked item is already expanded, close it (empty set)
        // If it's not expanded, open only this item
        if (!expanded.has(id)) {
            newExpanded.add(id);
        }

        setExpanded(newExpanded);

        // Close selected category when switching modules
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

    const handleCategoryClick = (category) => {
        console.log("Category clicked:", category);
        setSelectedCategory(category);
        setSelectedDocument(null);
        setDocumentDetails(null);
    };

    const handleDocumentClick = async (document) => {
        console.log("Document clicked:", document);
        setSelectedDocument(document);

        if (document.REF_SEQ_NO) {
            await fetchDocumentDetails(document.REF_SEQ_NO);
        }
    };

    const handleBackToCategory = () => {
        setSelectedDocument(null);
        setDocumentDetails(null);
    };

    const handleViewDocs = async (selectedDocs) => {
        const fileKey = `${selectedDocs.REF_SEQ_NO}-${selectedDocs.SERIAL_NO}`;
        setFileLoadingStates(prev => ({
            ...prev,
            [fileKey]: 'view'
        }));

        try {
            const downloadUrl = `https://apps.istreams-erp.com:4440/api/megacloud/download?email=${encodeURIComponent(userData.userEmail)}&refNo=${encodeURIComponent(selectedDocs.REF_SEQ_NO)}&fileName=${selectedDocs.DOC_NAME}`;
            const response = await axios.get(downloadUrl, {
                responseType: 'blob', // Important for handling binary/file data
            });

            // Create a blob from the response data
            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'application/octet-stream',
            });

            // Create a temporary URL and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', selectedDocs.DOC_NAME || `document_${selectedDocs.REF_SEQ_NO}`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
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

    const renderItem = (item, level = 0) => {
        const isExpanded = expanded.has(item.id);
        const hasChildren = item.children?.length > 0;
        const isCategory = item.type === 'folder' && level === 1;

        return (
            <div key={item.id} className="select-none">
                <div
                    className={`flex items-center py-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${selectedCategory?.id === item.id ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-600' : ''
                        }`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={() => {
                        if (isCategory) {
                            handleCategoryClick(item);
                        } else if (hasChildren) {
                            toggle(item.id);
                        }
                    }}
                >
                    {hasChildren && !isCategory && (
                        <div className="w-6 h-6 mr-1 flex items-center justify-center">
                            {isExpanded ?
                                <ChevronDown className="w-4 h-4" /> :
                                <ChevronRight className="w-4 h-4" />
                            }
                        </div>
                    )}

                    <div className="mr-2 flex items-center">
                        {item.type === 'file' ? (
                            <File className="w-4 h-4 text-green-500" />
                        ) : (
                            isExpanded ?
                                <FolderOpen className="w-4 h-4 text-blue-500" /> :
                                <Folder className="w-4 h-4 text-blue-500" />
                        )}
                    </div>

                    <span className="text-sm truncate flex-1 font-medium">
                        {item.name}
                    </span>

                    {item.type !== 'file' && (
                        <Badge variant="secondary" className="ml-2">
                            {item.count || (hasChildren ? item.children.length : 0)}
                        </Badge>
                    )}
                </div>

                {hasChildren && isExpanded && !isCategory && (
                    <div>{item.children.map(child => renderItem(child, level + 1))}</div>
                )}
            </div>
        );
    };

    const renderDocumentCard = (document, index) => (
        <div
            key={`${document.DOCUMENT_NO}_${index}`}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleDocumentClick(document)}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                    <FileText className="w-5 h-5 text-blue-500 mr-2" />
                    <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {document.DOCUMENT_NO}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {document.DOCUMENT_DESCRIPTION || 'No Description'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                {document.CREATED_DATE && (
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Created: {new Date(document.CREATED_DATE).toLocaleDateString()}</span>
                    </div>
                )}
                {document.CREATED_BY && (
                    <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        <span>By: {document.CREATED_BY}</span>
                    </div>
                )}
                {document.DOC_TYPE && (
                    <div>
                        <Badge variant="outline" className="text-xs">
                            {document.DOC_TYPE}
                        </Badge>
                    </div>
                )}
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
            <div className="space-y-4">
                {documentDetails.map((doc, index) => {
                    const fileKey = `${doc.REF_SEQ_NO}-${doc.SERIAL_NO}`;
                    const isLoading = fileLoadingStates[fileKey] === 'view';

                    return (
                        <div key={`${doc.REF_SEQ_NO}-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                            <div className="space-y-4">
                                <div className="border-b border-gray-200 dark:border-gray-600 pb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                            {doc.DOC_NAME}
                                        </h2>
                                    </div>

                                    {doc.DOC_NAME && (
                                        <Button
                                            onClick={() => handleViewDocs(doc)}
                                            disabled={isLoading}
                                            className="ml-4"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
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
            {/* Header Controls - Fixed height */}
            <div className="h-[10vh] p-2 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
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
                        {/* Search */}
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

                        {/* Module Filter */}
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
                                            {moduleName} ({moduleData?.children?.length || 0})
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Content Layout - Uses remaining screen space (88vh) */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row h-[88vh]">
                {/* Tree View - Fixed width and scrollable */}
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-600 overflow-y-auto p-2 h-[44vh] md:h-full">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Categories</h2>
                    {filteredModules.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">
                            {searchTerm || selectedModule !== 'all' ? 'No matching categories found' : 'No modules found'}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredModules.map(module => renderItem(module))}
                        </div>
                    )}
                </div>

                {/* Documents Display - Takes remaining space and scrollable */}
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
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Category
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
                                    <p className="text-gray-500">No documents found in this category</p>
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
                                <Folder className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-gray-500 mb-2">Select a Category</h2>
                                <p className="text-sm text-gray-400">Choose a category from the left panel to view its documents</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TreeView;



















// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { Folder, FolderOpen, File, ChevronRight, ChevronDown, Search, X, FileText, Calendar, User, Download } from 'lucide-react';
// import { useAuth } from "@/contexts/AuthContext";
// import { callSoapService } from "@/api/callSoapService";
// import { Badge } from './ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// import { Button } from './ui/button';
// import { Input } from './ui/input';

// const TreeView = () => {
//     const [expanded, setExpanded] = useState(new Set());
//     const [modules, setModules] = useState([]);
//     const [filteredModules, setFilteredModules] = useState([]);
//     const [documents, setDocuments] = useState([]);
//     const [selectedCategory, setSelectedCategory] = useState(null);
//     const [selectedCategoryDocuments, setSelectedCategoryDocuments] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [selectedModule, setSelectedModule] = useState('all');
//     const { userData } = useAuth();

//     useEffect(() => {
//         fetchCategoryData();
//     }, []);

//     useEffect(() => {
//         fetchAllDocuments();
//     }, [userData]);

//     useEffect(() => {
//         filterData();
//     }, [modules, searchTerm, selectedModule, documents]);

//     useEffect(() => {
//         if (selectedCategory) {
//             const categoryDocs = getDocumentsForCategory(selectedCategory.originalData?.CATEGORY_NAME);
//             setSelectedCategoryDocuments(categoryDocs);
//         }
//     }, [selectedCategory, documents]);

//     const fetchCategoryData = async () => {
//         try {
//             const payload = {
//                 DataModelName: "SYNM_DMS_DOC_CATEGORIES",
//                 WhereCondition: "",
//                 Orderby: "",
//             };

//             const response = await callSoapService(
//                 userData.clientURL,
//                 "DataModel_GetData",
//                 payload
//             );

//             console.log("Category API Response:", response);

//             let categories = [];
//             if (Array.isArray(response)) {
//                 categories = response;
//             } else if (response && response.data && Array.isArray(response.data)) {
//                 categories = response.data;
//             } else if (response && response.result && Array.isArray(response.result)) {
//                 categories = response.result;
//             } else if (response && typeof response === 'object') {
//                 const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
//                 if (possibleArrays.length > 0) {
//                     categories = possibleArrays[0];
//                 }
//             }

//             if (!Array.isArray(categories) || categories.length === 0) {
//                 console.warn("No valid category data found in response:", response);
//                 setModules([]);
//                 return;
//             }

//             const moduleMap = {};
//             const categoryCountMap = {};

//             categories.forEach(category => {
//                 const moduleName = category.MODULE_NAME || 'Other Modules';
//                 const categoryName = category.CATEGORY_NAME;

//                 if (!categoryCountMap[categoryName]) {
//                     categoryCountMap[categoryName] = 0;
//                 }
//                 categoryCountMap[categoryName]++;

//                 if (!moduleMap[moduleName]) {
//                     moduleMap[moduleName] = {
//                         id: `module_${moduleName}`,
//                         name: moduleName,
//                         type: 'folder',
//                         children: [],
//                         count: 0
//                     };
//                 }

//                 const existingCategory = moduleMap[moduleName].children.find(
//                     child => child.originalData?.CATEGORY_NAME === categoryName
//                 );

//                 if (!existingCategory) {
//                     moduleMap[moduleName].children.push({
//                         id: `category_${categoryName}_${moduleName}`,
//                         name: category.DISPLAY_NAME || categoryName,
//                         type: 'folder',
//                         originalData: category,
//                         count: 0,
//                         children: []
//                     });
//                     moduleMap[moduleName].count++;
//                 }
//             });

//             setModules(Object.values(moduleMap));
//         } catch (error) {
//             setError(error?.message || "Failed to fetch category data");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchAllDocuments = useCallback(async () => {
//         if (!userData || !userData.clientURL) {
//             console.warn("User data not available yet.");
//             return;
//         }

//         try {
//             setError(null);

//             const payload = {
//                 WhereCondition: "",
//                 Orderby: "REF_SEQ_NO DESC",
//                 IncludeEmpImage: false,
//             };

//             const response = await callSoapService(
//                 userData.clientURL,
//                 "DMS_GetDocMaster_List",
//                 payload
//             );

//             console.log("Documents Response:", response);

//             let documentsData = [];
//             if (Array.isArray(response)) {
//                 documentsData = response;
//             } else if (response && response.data && Array.isArray(response.data)) {
//                 documentsData = response.data;
//             } else if (response && response.result && Array.isArray(response.result)) {
//                 documentsData = response.result;
//             } else if (response && typeof response === 'object') {
//                 const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
//                 if (possibleArrays.length > 0) {
//                     documentsData = possibleArrays[0];
//                 }
//             }

//             if (!Array.isArray(documentsData)) {
//                 console.warn("No valid documents data found in response:", response);
//                 setDocuments([]);
//                 return;
//             }

//             setDocuments(documentsData);
//             console.log("Fetched documents:", documentsData.length);

//         } catch (err) {
//             console.error("Error fetching documents:", err);
//             setError(err.message || "Error fetching documents.");
//         }
//     }, [userData]);

//     const getDocumentsForCategory = useCallback((categoryName) => {
//         return documents.filter(doc =>
//             doc.DOC_RELATED_CATEGORY === categoryName
//         );
//     }, [documents]);

//     const buildModulesWithDocuments = useMemo(() => {
//         return modules.map(module => ({
//             ...module,
//             children: module.children.map(category => {
//                 const categoryDocs = getDocumentsForCategory(category.originalData?.CATEGORY_NAME);
//                 return {
//                     ...category,
//                     count: categoryDocs.length
//                 };
//             })
//         }));
//     }, [modules, documents, getDocumentsForCategory]);

//     const filterData = () => {
//         let filtered = [...buildModulesWithDocuments];

//         if (selectedModule !== 'all') {
//             filtered = filtered.filter(module => module.name === selectedModule);
//         }

//         if (searchTerm.trim()) {
//             const searchLower = searchTerm.toLowerCase();
//             filtered = filtered.map(module => {
//                 const filteredChildren = module.children.filter(category => {
//                     const categoryMatches = category.name.toLowerCase().includes(searchLower) ||
//                         category.originalData?.CATEGORY_NAME?.toLowerCase().includes(searchLower);

//                     const documentsMatch = getDocumentsForCategory(category.originalData?.CATEGORY_NAME).some(doc =>
//                         doc.DOCUMENT_NO?.toLowerCase().includes(searchLower) ||
//                         doc.DOCUMENT_DESCRIPTION?.toLowerCase().includes(searchLower)
//                     );

//                     return categoryMatches || documentsMatch;
//                 });

//                 return {
//                     ...module,
//                     children: filteredChildren
//                 };
//             }).filter(module => module.children.length > 0);
//         }

//         setFilteredModules(filtered);
//     };

//     // Updated toggle function for accordion behavior
//     const toggle = (id) => {
//         const newExpanded = new Set();

//         // If the clicked item is already expanded, close it (empty set)
//         // If it's not expanded, open only this item
//         if (!expanded.has(id)) {
//             newExpanded.add(id);
//         }

//         setExpanded(newExpanded);

//         // Close selected category when switching modules
//         setSelectedCategory(null);
//         setSelectedCategoryDocuments([]);
//     };

//     const clearSearch = () => {
//         setSearchTerm('');
//     };

//     const getTotalCounts = () => {
//         const totalModules = buildModulesWithDocuments.length;
//         const totalCategories = buildModulesWithDocuments.reduce((sum, module) => sum + module.children.length, 0);
//         const totalDocuments = documents.length;
//         return { totalModules, totalCategories, totalDocuments };
//     };

//     const getUniqueModules = () => {
//         return [...new Set(buildModulesWithDocuments.map(module => module.name))];
//     };

//     const handleCategoryClick = (category) => {
//         console.log("Category clicked:", category);
//         setSelectedCategory(category);
//     };

//     const handleDocumentAction = (action, document) => {
//         console.log(`${action} document:`, document);
//         // Add your document action logic here
//     };

//     const renderItem = (item, level = 0) => {
//         const isExpanded = expanded.has(item.id);
//         const hasChildren = item.children?.length > 0;
//         const isCategory = item.type === 'folder' && level === 1;

//         return (
//             <div key={item.id} className="select-none">
//                 <div
//                     className={`flex items-center py-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${selectedCategory?.id === item.id ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-600' : ''
//                         }`}
//                     style={{ paddingLeft: `${level * 20 + 8}px` }}
//                     onClick={() => {
//                         if (isCategory) {
//                             handleCategoryClick(item);
//                         } else if (hasChildren) {
//                             toggle(item.id);
//                         }
//                     }}
//                 >
//                     {hasChildren && !isCategory && (
//                         <div className="w-6 h-6 mr-1 flex items-center justify-center">
//                             {isExpanded ?
//                                 <ChevronDown className="w-4 h-4" /> :
//                                 <ChevronRight className="w-4 h-4" />
//                             }
//                         </div>
//                     )}

//                     <div className="mr-2 flex items-center">
//                         {item.type === 'file' ? (
//                             <File className="w-4 h-4 text-green-500" />
//                         ) : (
//                             isExpanded ?
//                                 <FolderOpen className="w-4 h-4 text-blue-500" /> :
//                                 <Folder className="w-4 h-4 text-blue-500" />
//                         )}
//                     </div>

//                     <span className="text-sm truncate flex-1 font-medium">
//                         {item.name}
//                     </span>

//                     {item.type !== 'file' && (
//                         <Badge variant="secondary" className="ml-2">
//                             {item.count || (hasChildren ? item.children.length : 0)}
//                         </Badge>
//                     )}
//                 </div>

//                 {hasChildren && isExpanded && !isCategory && (
//                     <div>{item.children.map(child => renderItem(child, level + 1))}</div>
//                 )}
//             </div>
//         );
//     };

//     const renderDocumentCard = (document, index) => (
//         <div key={`${document.DOCUMENT_NO}_${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between mb-3">
//                 <div className="flex items-center">
//                     <FileText className="w-5 h-5 text-blue-500 mr-2" />
//                     <div>
//                         <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
//                             {document.DOCUMENT_NO}
//                         </h3>
//                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                             {document.DOCUMENT_DESCRIPTION || 'No Description'}
//                         </p>
//                     </div>
//                 </div>
//                 <div className="flex space-x-1">
//                     <Button
//                         size="sm"
//                         variant="ghost"
//                         onClick={() => handleDocumentAction('download', document)}
//                         className="p-1"
//                     >
//                         <Download className="w-4 h-4" />
//                     </Button>
//                 </div>
//             </div>

//             <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
//                 {document.CREATED_DATE && (
//                     <div className="flex items-center">
//                         <Calendar className="w-3 h-3 mr-1" />
//                         <span>Created: {new Date(document.CREATED_DATE).toLocaleDateString()}</span>
//                     </div>
//                 )}
//                 {document.CREATED_BY && (
//                     <div className="flex items-center">
//                         <User className="w-3 h-3 mr-1" />
//                         <span>By: {document.CREATED_BY}</span>
//                     </div>
//                 )}
//                 {document.DOC_TYPE && (
//                     <div>
//                         <Badge variant="outline" className="text-xs">
//                             {document.DOC_TYPE}
//                         </Badge>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );

//     if (loading) {
//         return (
//             <div className="p-2 text-center text-gray-500">
//                 Loading document categories...
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="p-2 text-center text-red-500">
//                 Error: {error}
//             </div>
//         );
//     }

//     const { totalModules, totalCategories, totalDocuments } = getTotalCounts();
//     const uniqueModules = getUniqueModules();

//     return (
//         <div className="w-full h-screen flex flex-col">
//             {/* Header Controls - Fixed height */}
//             <div className="h-[10vh] p-2 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
//                 <div className="flex items-center justify-between mb-2 flex-col sm:flex-row gap-4">
//                     <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
//                         <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
//                             <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
//                                 Modules: <Badge variant="outline">{totalModules}</Badge>
//                             </span>
//                             <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
//                                 Categories: <Badge variant="outline">{totalCategories}</Badge>
//                             </span>
//                             <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
//                                 Documents: <Badge variant="outline">{totalDocuments}</Badge>
//                             </span>
//                         </div>
//                     </div>

//                     <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:mt-0">
//                         {/* Search */}
//                         <div className="relative flex-1 sm:flex-none">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//                             <Input
//                                 type="text"
//                                 placeholder="Search Categories..."
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="w-full sm:w-48 pl-10 pr-10 border-gray-600 dark:border-gray-400"
//                             />
//                             {searchTerm && (
//                                 <Button
//                                     onClick={clearSearch}
//                                     className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 p-0"
//                                     variant="ghost"
//                                 >
//                                     <X className="w-4 h-4" />
//                                 </Button>
//                             )}
//                         </div>

//                         {/* Module Filter */}
//                         <Select value={selectedModule} onValueChange={setSelectedModule}>
//                             <SelectTrigger className="w-full sm:w-48 border-gray-600 dark:border-gray-400">
//                                 <SelectValue placeholder="All Modules" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="all">All Modules ({totalModules})</SelectItem>
//                                 {uniqueModules.map(moduleName => {
//                                     const moduleData = buildModulesWithDocuments.find(m => m.name === moduleName);
//                                     return (
//                                         <SelectItem key={moduleName} value={moduleName}>
//                                             {moduleName} ({moduleData?.children?.length || 0})
//                                         </SelectItem>
//                                     );
//                                 })}
//                             </SelectContent>
//                         </Select>
//                     </div>
//                 </div>
//             </div>

//             {/* Main Content Layout - Uses remaining screen space (88vh) */}
//             <div className="flex flex-1 overflow-hidden flex-col md:flex-row h-[88vh]">
//                 {/* Tree View - Fixed width and scrollable */}
//                 <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-600 overflow-y-auto p-2 h-[44vh] md:h-full">
//                     <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Categories</h2>
//                     {filteredModules.length === 0 ? (
//                         <div className="p-2 text-center text-gray-500">
//                             {searchTerm || selectedModule !== 'all' ? 'No matching categories found' : 'No modules found'}
//                         </div>
//                     ) : (
//                         <div className="space-y-1">
//                             {filteredModules.map(module => renderItem(module))}
//                         </div>
//                     )}
//                 </div>

//                 {/* Documents Display - Takes remaining space and scrollable */}
//                 <div className="flex-1 overflow-y-auto p-2 h-[44vh] md:h-full">
//                     {selectedCategory ? (
//                         <div>
//                             <div className="mb-6">
//                                 <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
//                                     {selectedCategory.name}
//                                 </h2>
//                             </div>

//                             {selectedCategoryDocuments.length === 0 ? (
//                                 <div className="text-center py-12">
//                                     <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                                     <p className="text-gray-500">No documents found in this category</p>
//                                 </div>
//                             ) : (
//                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
//                                     {selectedCategoryDocuments.map((document, index) =>
//                                         renderDocumentCard(document, index)
//                                     )}
//                                 </div>
//                             )}
//                         </div>
//                     ) : (
//                         <div className="flex items-center justify-center h-full">
//                             <div className="text-center">
//                                 <Folder className="w-20 h-20 text-gray-300 mx-auto mb-4" />
//                                 <h2 className="text-lg font-semibold text-gray-500 mb-2">Select a Category</h2>
//                                 <p className="text-sm text-gray-400">Choose a category from the left panel to view its documents</p>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default TreeView;