import GlobalSearchInput from "@/components/GlobalSearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { callSoapService } from "@/api/callSoapService";
import { FileSearch } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useLocation } from "react-router-dom";
import DocumentFormModal from "../components/dialog/DocumentFormModal";
import TaskForm from "../components/TaskForm";
import { useAuth } from "../contexts/AuthContext";
import { formatDateTime } from "../utils/dateUtils";
import { useToast } from "@/hooks/useToast";
import AccessDenied from "@/components/AccessDenied";

// Custom hook for debounced search with transition
const useDebounceWithTransition = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedValue(value);
      });
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return [debouncedValue, isPending];
};

// Optimized skeleton loader
const DocumentSkeleton = memo(() => (
  <Card className="col-span-1">
    <CardContent className="p-4">
      <div className="animate-pulse">
        <div className="flex items-start gap-2 mb-4">
          <div className="bg-gray-200 p-2 rounded-lg w-10 h-10 shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded"></div>
            <div className="w-16 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

DocumentSkeleton.displayName = "DocumentSkeleton";

// Heavily optimized DocumentCard with minimal re-renders
const DocumentCard = memo(
  ({
    doc,
    assignedUser,
    verifyEnabled,
    onVerify,
    onView,
    onEmployeeSelect,
    users,
    usersLoading,
    userViewRights,
  }) => {
    const handleEmployeeChange = useCallback(
      (value) => {
        onEmployeeSelect(doc.REF_SEQ_NO, value);
      },
      [doc.REF_SEQ_NO, onEmployeeSelect]
    );

    const handleVerifyClick = useCallback(() => {
      onVerify(doc);
    }, [doc, onVerify]);

    const handleViewClick = useCallback(() => {
      onView(doc);
    }, [doc, onView]);

    const isAssigned = Boolean(assignedUser);
    const isVerified = Boolean(doc.VERIFIED_BY);
    const canVerify = verifyEnabled && !isVerified;

    return (
      <Card className="col-span-1">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 w-full mb-4">
            <div className="bg-neutral-100 p-2 rounded-lg shrink-0">
              <FileSearch className="w-4 h-4 text-neutral-900" />
            </div>
            <div className="flex justify-between items-start gap-2 w-full min-w-0">
              <div className="truncate flex-1">
                <h2
                  className="text-lg font-semibold leading-tight mb-1 truncate"
                  title={doc.DOCUMENT_DESCRIPTION}
                >
                  {doc.DOCUMENT_DESCRIPTION}
                </h2>
                <p className="text-xs text-gray-500 leading-none truncate">
                  {doc.DOCUMENT_NO}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 shrink-0">
                {doc.REF_SEQ_NO}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium truncate">
                {doc.USER_NAME}
              </span>
              <span className="text-sm text-gray-500 shrink-0">
                {doc.NO_OF_DOCUMENTS} File(s)
              </span>
            </div>

            <p className="text-sm font-medium">
              Category:{" "}
              <span className="text-gray-500">{doc.DOC_RELATED_CATEGORY}</span>
            </p>

            <div className="flex items-end justify-between gap-2">
              <div className="flex-1">
                <div className="mb-3">
                  {isVerified ? (
                    <span
                      className={`text-xs ${
                        doc.DOCUMENT_STATUS === "Rejected"
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {doc.DOCUMENT_STATUS === "Rejected"
                        ? "Rejected by"
                        : "Verified by"}
                    </span>
                  ) : (
                    <span className="text-xs badge badge-error badge-outline px-1">
                      Unverified
                    </span>
                  )}
                </div>
                <Button
                  className={`btn btn-xs w-full ${
                    canVerify ? "btn-success" : "btn-ghost btn-active"
                  }`}
                  onClick={canVerify ? handleVerifyClick : undefined}
                  disabled={!canVerify}
                >
                  {doc.VERIFIED_BY || "Verify"}
                </Button>
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-3">Assign to</p>
                <Select
                  value={assignedUser || ""}
                  onValueChange={handleEmployeeChange}
                  disabled={isAssigned || isVerified || usersLoading}
                >
                  <SelectTrigger className="w-full text-center h-8 text-xs">
                    <SelectValue
                      placeholder={usersLoading ? "Loading..." : "Assign to"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user, userIndex) => (
                      <SelectItem
                        key={`user-${user.user_name}-${userIndex}`}
                        value={user.user_name}
                      >
                        {user.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={handleViewClick}
                className="shrink-0"
              >
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

DocumentCard.displayName = "DocumentCard";

export const DocumentViewPage = () => {
  // Core data states
  const [allDocs, setAllDocs] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState(new Map());

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI states
  const [globalFilter, setGlobalFilter] = useState("");
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [docFormMode, setDocFormMode] = useState("view");

  // User rights
  const [userViewRights, setUserViewRights] = useState("");
  const [userRights, setUserRights] = useState("");
  const [rightsChecked, setRightsChecked] = useState(false);

  // Virtual scrolling
  const [visibleCount, setVisibleCount] = useState(9);
  const BATCH_SIZE = 9;

  const modalRefTask = useRef(null);
  const formModalRef = useRef(null);
  const { userData } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  // Extract category from URL location state
  const urlCategory = location.state?.categoryName || "";

  // Set global filter based on URL category
  useEffect(() => {
    if (urlCategory) {
      setGlobalFilter(urlCategory);
    }
  }, [urlCategory]);

  // Optimized debounced search with transition
  const [debouncedFilter, isSearchPending] = useDebounceWithTransition(
    globalFilter,
    300
  );

  // Memoized initial task data
  const initialTaskData = useMemo(
    () => ({
      UserName: userData.userName,
      Subject: "",
      Details: "",
      RelatedTo: "",
      AssignedUser: "",
      CreatorReminderOn: formatDateTime(new Date(Date.now() + 2 * 86400000)),
      StartDate: formatDateTime(new Date()),
      CompDate: formatDateTime(new Date(Date.now() + 86400000)),
      RemindTheUserOn: formatDateTime(new Date()),
      RefTaskID: -1,
      DMSSeqNo: 0,
      verifiedBy: userData.userName,
    }),
    [userData.userName]
  );

  const [taskData, setTaskData] = useState(initialTaskData);

  // Optimized service call payload
  const getDocMasterListPayload = useMemo(
    () => ({
      WhereCondition:
        userData.isAdmin ||
        userViewRights === "Allowed" ||
        categoryList.length > 0
          ? ""
          : ` AND (USER_NAME = '${userData.userName}' OR ASSIGNED_USER = '${userData.userName}')`,
      Orderby: "REF_SEQ_NO DESC",
      IncludeEmpImage: false,
    }),
    [userViewRights, userData.isAdmin, userData.userName]
  );

  // Optimized document filtering with memoization
  const filteredDocs = useMemo(() => {
    if (!allDocs.length) return [];
    if (!debouncedFilter.trim()) return allDocs;

    const searchTerm = debouncedFilter.toLowerCase().trim();

    return allDocs.filter((doc) => {
      if (doc.REF_SEQ_NO?.toString().includes(searchTerm)) return true;
      if (doc.DOCUMENT_DESCRIPTION?.toLowerCase().includes(searchTerm))
        return true;
      if (doc.DOCUMENT_NO?.toLowerCase().includes(searchTerm)) return true;
      if (doc.USER_NAME?.toLowerCase().includes(searchTerm)) return true;
      if (doc.DOC_RELATED_CATEGORY?.toLowerCase().includes(searchTerm))
        return true;
      if (doc.DOC_RELATED_TO?.toLowerCase().includes(searchTerm)) return true;

      return false;
    });
  }, [allDocs, debouncedFilter]);

  // Filter documents by URL category and user permissions
  const filteredByCategory = useMemo(() => {
    if (!urlCategory) {
      // If no category is provided in the URL, apply existing logic
      if (userData.isAdmin) {
        return filteredDocs; // Admin sees all filtered documents
      }

      if (categoryList.length > 0) {
        const allowed = new Set(categoryList.map((cat) => cat.CATEGORY_NAME));
        return filteredDocs.filter((doc) =>
          allowed.has(doc.DOC_RELATED_CATEGORY)
        );
      }
      return filteredDocs;
    }

    // If URL category is provided, filter by that category
    const lowerUrlCategory = urlCategory.toLowerCase();
    if (userData.isAdmin) {
      // Admins see all documents matching the URL category
      return filteredDocs.filter((doc) =>
        doc.DOC_RELATED_CATEGORY?.toLowerCase().includes(lowerUrlCategory)
      );
    }

    // Non-admins see documents they have access to that match the URL category
    if (categoryList.length > 0) {
      const allowed = new Set(categoryList.map((cat) => cat.CATEGORY_NAME));
      return filteredDocs.filter(
        (doc) =>
          allowed.has(doc.DOC_RELATED_CATEGORY) &&
          doc.DOC_RELATED_CATEGORY?.toLowerCase().includes(lowerUrlCategory)
      );
    }

    return filteredDocs.filter((doc) =>
      doc.DOC_RELATED_CATEGORY?.toLowerCase().includes(lowerUrlCategory)
    );
  }, [userData.isAdmin, filteredDocs, categoryList, urlCategory]);

  // Virtualized visible documents
  const visibleDocs = useMemo(() => {
    return filteredByCategory.slice(0, visibleCount);
  }, [filteredByCategory, visibleCount]);

  // Optimized assignment processing
  const processInitialAssignments = useCallback((docs) => {
    const assignmentMap = new Map();

    docs.forEach((doc) => {
      if (doc.ASSIGNED_USER) {
        assignmentMap.set(doc.REF_SEQ_NO, {
          user: doc.ASSIGNED_USER,
          canVerify: true,
        });
      }
    });

    return assignmentMap;
  }, []);

  const fetchCategoryList = useCallback(async () => {
    try {
      const payload = {
        UserName: userData.userName,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_Get_Allowed_DocCategories",
        payload
      );

      setCategoryList(response || []);
    } catch (err) {
      toast({
        title: "Failed to load categories.",
        description: err.message || "Error",
        variant: "destructive",
      });
    }
  }, [userData, toast]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await callSoapService(
        userData.clientURL,
        "DMS_GetDocMaster_List",
        getDocMasterListPayload
      );

      if (!Array.isArray(response) || !response.length) {
        setError("No documents available.");
        setAllDocs([]);
        return;
      }

      const assignmentMap = processInitialAssignments(response);

      setAllDocs(response);
      setAssignments(assignmentMap);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err.message || "Error fetching documents.");
      setAllDocs([]);
    } finally {
      setIsLoading(false);
    }
  }, [getDocMasterListPayload, userData.clientURL, processInitialAssignments]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const payload = {
        UserName: userData.userName,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_Get_All_ActiveUsers",
        payload
      );

      setUsers(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [userData.clientURL, userData.userName]);

  const fetchUserViewRights = useCallback(async () => {
    try {
      const userType = userData.isAdmin ? "ADMINISTRATOR" : "USER";
      const payload = {
        UserName: userData.userName,
        FormName: "DMS-DOCUMENTLISTVIEWALL",
        FormDescription: "View Rights For All Documents",
        UserType: userType,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_CheckRights_ForTheUser",
        payload
      );

      setUserViewRights(response);
    } catch (error) {
      console.error("Failed to fetch user rights:", error);
      toast({
        variant: "destructive",
        title: error,
      });
    }
  }, [userData.clientURL, userData.isAdmin, userData.userName]);

  const fetchUserRights = useCallback(async () => {
    try {
      const userType = userData.isAdmin ? "ADMINISTRATOR" : "USER";
      const payload = {
        UserName: userData.userName,
        FormName: "DMS-DOCUMENTVIEW",
        FormDescription: "Document View",
        UserType: userType,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_CheckRights_ForTheUser",
        payload
      );

      setUserRights(response);
    } catch (error) {
      console.error("Failed to fetch user rights:", error);
      toast({
        variant: "destructive",
        title: error,
      });
    } finally {
      setRightsChecked(true);
    }
  }, [userData.clientURL, userData.isAdmin, userData.userName]);

  // Load more documents
  const loadMoreDocs = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(prev + BATCH_SIZE, filteredByCategory.length)
    );
  }, [filteredByCategory.length]);

  // Initialize data
  useEffect(() => {
    fetchCategoryList();
    fetchDocuments();
    fetchUsers();
    fetchUserRights();
    fetchUserViewRights();
  }, [
    fetchDocuments,
    fetchCategoryList,
    fetchUsers,
    fetchUserViewRights,
    fetchUserRights,
  ]);

  // Event handlers
  const handleVerifySuccess = useCallback((refSeqNo, verifierName) => {
    setAllDocs((prevDocs) =>
      prevDocs.map((doc) =>
        doc.REF_SEQ_NO === refSeqNo
          ? { ...doc, VERIFIED_BY: verifierName }
          : doc
      )
    );
    formModalRef.current?.close();
    modalRefTask.current?.showModal();
  }, []);

  const handleVerify = useCallback((doc) => {
    setSelectedDocument(doc);
    setDocFormMode("verify");
    formModalRef.current?.showModal();
  }, []);

  const handleView = useCallback(
    (doc) => {
      const hasAccess = String(userViewRights).toLowerCase() === "allowed";

      if (!hasAccess && categoryList.length === 0) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have permission to view documents.",
        });
        return;
      }

      setSelectedDocument(doc);
      setDocFormMode("view");
      formModalRef.current?.showModal();
    },
    [userViewRights, categoryList, toast]
  );

  // Optimized category fetching with caching
  const categoryCache = useRef(new Map());

  const fetchCategories = useCallback(
    async (userName) => {
      if (categoryCache.current.has(userName)) {
        return categoryCache.current.get(userName);
      }

      try {
        const payload = { UserName: userName };
        const response = await callSoapService(
          userData.clientURL,
          "DMS_Get_Allowed_DocCategories",
          payload
        );

        const categories = response.map((category) => category.CATEGORY_NAME);
        categoryCache.current.set(userName, categories);
        return categories;
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
    [userData.clientURL]
  );

  // Optimized employee selection
  const handleEmployeeSelect = useCallback(
    async (refSeqNo, selectedUserName) => {
      const isConfirm = window.confirm(
        "Are you sure you want to assign? This action cannot be undone."
      );
      if (!isConfirm) return;

      const doc = allDocs.find((d) => d.REF_SEQ_NO === refSeqNo);
      if (!doc) return;

      try {
        setIsProcessing(true);

        const categories = await fetchCategories(selectedUserName);
        const hasAccess = categories.includes(doc.DOC_RELATED_CATEGORY);

        if (!hasAccess) {
          alert("Selected user does not have access to this category.");
          return;
        }

        setTaskData((prev) => ({
          ...prev,
          taskName: doc.DOCUMENT_DESCRIPTION,
          relatedTo: doc.DOC_RELATED_TO,
          refSeqNo: doc.REF_SEQ_NO,
          dmsSeqNo: doc.REF_SEQ_NO,
          verifiedBy: doc.VERIFIED_BY,
          assignedTo: selectedUserName,
        }));

        const payload = {
          USER_NAME: userData.userName,
          ASSIGNED_TO: selectedUserName,
          REF_SEQ_NO: doc.REF_SEQ_NO,
        };

        const response = await callSoapService(
          userData.clientURL,
          "DMS_Update_AssignedTo",
          payload
        );

        setAssignments((prev) =>
          new Map(prev).set(refSeqNo, {
            user: selectedUserName,
            canVerify: true,
          })
        );
      } catch (error) {
        console.error("Error assigning document:", error);
        alert("Failed to assign document. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [allDocs, fetchCategories, userData.userName, userData.clientURL]
  );

  const handleTaskChange = useCallback((e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleTaskCreated = useCallback((newTask) => {
    setTaskData((prev) => ({ ...prev, newTask }));
  }, []);

  // Show loading state
  if (isLoading || !rightsChecked) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <div className="relative">
          <GlobalSearchInput value="" onChange={() => {}} disabled />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <DocumentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Check user rights
  if (String(userRights).toLowerCase() !== "allowed") {
    return <AccessDenied />;
  }

  const hasMore = visibleCount < filteredByCategory.length;
  const showingCount = Math.min(visibleDocs.length, visibleCount);

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {/* Search and status */}
        <div className="relative">
          <GlobalSearchInput
            value={globalFilter}
            onChange={setGlobalFilter}
            disabled={isSearchPending}
          />

          {(isSearchPending || isProcessing) && (
            <div className="flex items-center gap-3 mt-2 min-h-[20px]">
              {isSearchPending && (
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span>Searching...</span>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center space-x-2 text-xs text-amber-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600"></div>
                  <span>Processing...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">{error}</p>
            <Button onClick={fetchDocuments} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Documents grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {visibleDocs.length > 0 ? (
                visibleDocs.map((doc) => {
                  const assignment = assignments.get(doc.REF_SEQ_NO);
                  return (
                    <DocumentCard
                      key={doc.REF_SEQ_NO}
                      doc={doc}
                      assignedUser={assignment?.user}
                      verifyEnabled={assignment?.canVerify}
                      onVerify={handleVerify}
                      onView={handleView}
                      onEmployeeSelect={handleEmployeeSelect}
                      users={users}
                      usersLoading={isLoadingUsers}
                      userViewRights={userViewRights}
                    />
                  );
                })
              ) : debouncedFilter ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">
                    No documents match your search: "{debouncedFilter}"
                  </p>
                  <Button
                    onClick={() => setGlobalFilter("")}
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">No documents available.</p>
                  <Button
                    onClick={fetchDocuments}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Refresh
                  </Button>
                </div>
              )}
            </div>

            {/* Load more button */}
            {hasMore && !debouncedFilter && (
              <div className="text-center py-4">
                <Button onClick={loadMoreDocs} variant="outline">
                  Load More ({filteredByCategory.length - visibleCount}{" "}
                  remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <TaskForm
        modalRefTask={modalRefTask}
        users={users}
        taskData={taskData}
        onTaskChange={handleTaskChange}
        onTaskCreated={handleTaskCreated}
      />

      <DocumentFormModal
        formModalRef={formModalRef}
        selectedDocument={selectedDocument}
        docMode={docFormMode}
        onSuccess={handleVerifySuccess}
      />
    </>
  );
};
