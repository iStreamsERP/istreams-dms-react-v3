import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilePen,
  SquarePenIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PacmanLoader } from "react-spinners";
import { useAuth } from "../contexts/AuthContext";
import DocumentFormModal from "./dialog/DocumentFormModal";
import DocumentUploadModal from "./dialog/DocumentUploadModal";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { callSoapService } from "../api/callSoapService";
import { useToast } from "@/hooks/useToast";

const DocumentTable = ({ fetchDataRef, globalFilter, setGlobalFilter, onOpenUpload }) => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const { hasPermission, isAdmin, docCategories } = usePermissions();

  const [userEditRights, setUserEditRights] = useState("");

  const formModalRef = useRef(null);
  const uploadModalRef = useRef(null);

  const [documentList, setDocumentList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedDocument, setSelectedDocument] = useState(null);

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

  const fetchDocsMasterList = useCallback(async () => {
    setLoading(true);
    try {
      const whereCondition =
        isAdmin || hasPermission("VIEW_ALL_DOCS") || docCategories.length > 0
          ? ""
          : ` AND (USER_NAME = '${userData.userName}' OR ASSIGNED_USER = '${userData.userName}')`;

      const payload = {
        WhereCondition: whereCondition,
        Orderby: "REF_SEQ_NO DESC",
        IncludeEmpImage: false,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_GetDocMaster_List",
        payload
      );

      const enriched = (Array.isArray(response) ? response : []).map((doc) => ({
        ...doc,
        uploadedDocs: Array.isArray(doc.uploadedDocs) ? doc.uploadedDocs : [],
        IsPrimaryDocument: "",
      }));

      setDocumentList(enriched);
      setError(null);
      return enriched;
    } catch (err) {
      console.error("Error fetching master data:", err);
      setError(err.message || "Error fetching data");
      return [];
    } finally {
      setLoading(false);
    }
  }, [userData.userEmail, userData.clientURL]);

  const fetchUserEditRights = async () => {
    try {
      const userType = userData.isAdmin ? "ADMINISTRATOR" : "USER";
      const payload = {
        UserName: userData.userName,
        FormName: "DMS-DOCUMENTLISTEDITALL",
        FormDescription: "Edit Rights For All Documents",
        UserType: userType,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_CheckRights_ForTheUser",
        payload
      );

      setUserEditRights(response);
    } catch (error) {
      console.error("Failed to fetch user rights:", error);
      toast({
        variant: "destructive",
        title: error,
      });
    }
  };

  // Initial data load
  useEffect(() => {
    fetchCategoryList();
    fetchDocsMasterList();

    const getEditRights = async () => {
      await fetchUserEditRights();
    };

    getEditRights();
  }, [fetchDocsMasterList]);

  // Expose fetch function to parent via ref for external refresh
  useEffect(() => {
    if (fetchDataRef) {
      fetchDataRef.current = fetchDocsMasterList;
    }
  }, [fetchDataRef, fetchDocsMasterList]);

  const onUploadSuccess = () => {
    fetchDocsMasterList();
    if (uploadModalRef?.current) {
      uploadModalRef.current.close();
    } else {
      console.error("Upload modal element not found");
    }
  };

  const canCurrentUserEdit = (doc) => {
    if (doc?.USER_NAME !== userData.userName)
      return "Access Denied: This document is created by another user.";

    const status = doc?.DOCUMENT_STATUS?.toUpperCase();
    if (status === "VERIFIED")
      return "Access Denied: This document has been verified and approved for processing.";
    if (status === "AWAITING FOR USER ACCEPTANCE")
      return `Access Denied: This document has been assigned to ${doc.ASSIGNED_USER}.`;
    if (status === "IN PROGRESS")
      return "Access Denied: This document is in progress status.";
    if (status === "COMPLETED")
      return "Access Denied: This document has been processed and completed.";
    return "";
  };

  const handleOpenUpload = onOpenUpload;

  const handleOpenForm = useCallback(
    (doc) => {
      const hasAccess = String(userEditRights).toLowerCase() === "allowed";

      if (!hasAccess) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have permission to edit documents.",
        });
        return;
      }

      console.log(doc);


      setSelectedDocument(doc);
      if (formModalRef?.current) {
        formModalRef.current.showModal();
      } else {
        console.error("Form modal element not found");
      }
    },
    [userEditRights, toast]
  );

  const handleDelete = useCallback(
    async (doc) => {
      const errorMsg = canCurrentUserEdit(doc);
      if (errorMsg) {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: errorMsg,
        });
        return;
      }

      if (!window.confirm("Are you sure you want to delete this document?"))
        return;

      try {
        const payload = {
          USER_NAME: doc.USER_NAME,
          REF_SEQ_NO: doc.REF_SEQ_NO,
        };

        const response = await callSoapService(
          userData.clientURL,
          "DMS_Delete_DMS_Master",
          payload
        );

        setDocumentList((prevData) =>
          prevData.filter((item) => item.REF_SEQ_NO !== doc.REF_SEQ_NO)
        );

        toast({
          variant: "destructive",
          title: "Document deleted successfully.",
          description:
            typeof response === "string" ? response : "Document deleted.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: error?.message || "Unknown error occurred.",
        });
      }
    },
    [userData.userEmail, userData.clientURL, toast]
  );

  const columns = useMemo(
    () => [
      {
        header: () => <p className="truncate w-full">Ref No</p>,
        accessorKey: "REF_SEQ_NO",
        cell: ({ row }) => (
          <p
            className="truncate"
            style={{ width: 40 }}
            title={row.getValue("REF_SEQ_NO")}
          >
            {row.getValue("REF_SEQ_NO")}
          </p>
        ),
      },
      {
        header: () => <p className="truncate w-full">Document Name</p>,
        accessorKey: "DOCUMENT_DESCRIPTION",
        cell: ({ row }) => (
          <div
            className="truncate"
            style={{ width: 150 }}
            title={row.getValue("DOCUMENT_DESCRIPTION")}
          >
            <div>
              <p className="text-[10px] text-gray-500 truncate">
                {row.original.DOCUMENT_NO}
              </p>
              <p className="text-xs truncate">
                {row.getValue("DOCUMENT_DESCRIPTION")}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: () => <p className="truncate">Uploader</p>,
        accessorKey: "USER_NAME",
        cell: ({ row }) => (
          <div
            className="truncate"
            style={{ width: 100 }}
            title={row.getValue("USER_NAME")}
          >
            <div>
              <p className="text-xs truncate">{row.getValue("USER_NAME")}</p>
            </div>
          </div>
        ),
      },
      {
        header: () => <p className="truncate">Channel Source</p>,
        accessorKey: "CHANNEL_SOURCE",
        cell: ({ row }) => (
          <p
            className="text-xs truncate"
            style={{ width: 100 }}
            title={row.getValue("CHANNEL_SOURCE")}
          >
            {(row.getValue("CHANNEL_SOURCE") || "").trim() === ""
              ? userData.organizationName
              : row.getValue("CHANNEL_SOURCE")}
          </p>
        ),
      },
      {
        header: () => <p className="truncate w-full">Related to</p>,
        accessorKey: "DOC_RELATED_TO",
        cell: ({ row }) => (
          <p
            className="truncate"
            style={{ width: 100 }}
            title={row.getValue("DOC_RELATED_TO")}
          >
            {row.getValue("DOC_RELATED_TO")}
          </p>
        ),
      },
      {
        header: () => <p className="truncate w-full">Category</p>,
        accessorKey: "DOC_RELATED_CATEGORY",
        cell: ({ row }) => (
          <p
            className="truncate"
            style={{ width: 100 }}
            title={row.getValue("DOC_RELATED_CATEGORY")}
          >
            {row.getValue("DOC_RELATED_CATEGORY")}
          </p>
        ),
      },
      {
        header: () => <p className="truncate w-full">Status</p>,
        accessorKey: "DOCUMENT_STATUS",
        cell: ({ row }) => {
          const status = row.getValue("DOCUMENT_STATUS");

          // Define a color map for statuses
          const statusColorMap = {
            ACCEPTED: "text-green-600",
            Pending: "text-yellow-600",
            Rejected: "text-red-600",
            Inprogress: "text-blue-600",
          };

          // Fallback to gray if status doesn't match any key
          const statusClass = statusColorMap[status] || "text-gray-600";

          return (
            <p
              className={`truncate ${statusClass}`}
              style={{ width: 80 }}
              title={status}
            >
              {status}
            </p>
          );
        },
      },
      {
        header: () => <p className="truncate w-full">Assigned to</p>,
        accessorKey: "ASSIGNED_USER",
        cell: ({ row }) => (
          <p
            className="truncate"
            style={{ width: 80 }}
            title={row.getValue("ASSIGNED_USER")}
          >
            {row.getValue("ASSIGNED_USER")}
          </p>
        ),
      },
      {
        header: () => (
          <p className="text-xs text-gray-600 text-right w-full">Docs</p>
        ),
        accessorKey: "NO_OF_DOCUMENTS",
        cell: (info) => {
          const value = info.getValue();
          const rowData = info.row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              {value > 0 ? (
                <button
                  onClick={() => handleOpenUpload(rowData)}
                  className="flex items-center gap-1"
                  title="Upload/View Documents"
                >
                  <Badge className="bg-green-500 text-white rounded-full text-[10px] font-bold px-2 py-[2px]">
                    {value}
                  </Badge>
                  <FilePen className="h-4 w-4" />
                </button>
              ) : (
                <Button
                  onClick={() => handleOpenUpload(rowData)}
                  variant="ghost"
                  size="icon"
                  title="Upload Document"
                  className="h-6 w-6"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
      {
        header: () => <p className="truncate w-full"></p>,
        id: "actions",
        size: 50,
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => handleOpenForm(doc)}>
                <SquarePenIcon className="h-4 w-4" />
              </button>
              <button
                className="text-red-600"
                onClick={() => handleDelete(doc)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [handleDelete, handleOpenUpload, handleOpenForm]
  );

  // Global filter function
  const globalFilterFn = useCallback((row, columnId, filterValue) => {
    return Object.values(row.original)
      .filter((val) => typeof val === "string" || typeof val === "number")
      .some((val) =>
        String(val).toLowerCase().includes(String(filterValue).toLowerCase())
      );
  }, []);

  const filteredDocuments = useMemo(() => {
    if (userData.isAdmin) {
      return documentList; // Admin sees all
    }

    // if (categoryList.length > 0) {
    //   const allowedCategories = categoryList.map((cat) => cat.CATEGORY_NAME);
    //   return documentList.filter((doc) =>
    //     allowedCategories.includes(doc.DOC_RELATED_CATEGORY)
    //   );
    // }
    // return documentList;

    if (categoryList.length > 0) {
      const allowed = new Set(categoryList.map((cat) => cat.CATEGORY_NAME));
      return documentList.filter((doc) =>
        allowed.has(doc.DOC_RELATED_CATEGORY)
      );
    }
    // no category selected: use full filteredDocs
    return documentList;
  }, [userData.isAdmin, documentList, categoryList]);

  // Initialize TanStack table
  const table = useReactTable({
    data: filteredDocuments,
    columns,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter },
    getExpandedRowModel: getExpandedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-400 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-400 dark:divide-gray-700">
          <thead className="bg-slate-100 transition-colors dark:bg-slate-950 ">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.column.getSize() }}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {!header.isPlaceholder &&
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-slate-100 transition-colors dark:bg-slate-950 divide-y divide-gray-400 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="12" className="text-center py-4">
                  <PacmanLoader color="#36d399" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan="12"
                  className="text-center text-sm text-red-500 py-4"
                >
                  Error: {error}
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.original.REF_SEQ_NO}
                  className="hover:bg-slate-200 dark:hover:bg-slate-900"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={`${row.original.REF_SEQ_NO}-${cell.column.id}`}
                      style={{ width: cell.column.getSize() }}
                      className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="12"
                  className="text-sm text-center py-4 text-gray-500"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        {/* LEFT SIDE: All controls together on larger screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded border disabled:opacity-50"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              className="p-2 rounded border disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 text-sm text-gray-800 dark:text-gray-200">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <button
              className="p-2 rounded border disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              className="p-2 rounded border disabled:opacity-50"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

          {/* Go to Page */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className="text-sm text-gray-800 dark:text-gray-200">Go to page:</span>
            <Input
              type="number"
              placeholder="Page"
              className="w-16 px-2 py-1 text-sm"
              min="1"
              max={table.getPageCount()}
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
            />
          </div>

          {/* Show rows */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(val) => table.setPageSize(Number(val))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Rows per page</SelectLabel>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={String(pageSize)}>
                      Show {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DocumentFormModal
        formModalRef={formModalRef}
        selectedDocument={selectedDocument}
        onUploadSuccess={fetchDocsMasterList}
      />

      {/* Modal for Document Upload */}
      <DocumentUploadModal
        uploadModalRef={uploadModalRef}
        selectedDocument={selectedDocument}
        onUploadSuccess={fetchDocsMasterList}
      />
    </>
  );
};

export default DocumentTable;