import { useState, useEffect, useCallback } from "react";
import { callSoapService } from "@/api/callSoapService";
import axios from "axios";
import { Download, X, XIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "../../contexts/AuthContext";
import { getFileIcon } from "../../utils/getFileIcon";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/useToast";
import { useDocumentRights } from "@/hooks/useDocumentRights";

// Define interfaces for type safety
interface Document {
  REF_SEQ_NO: string;
  SERIAL_NO: string;
  DOC_NAME: string;
  DOCUMENT_NO?: string;
  DOC_EXT?: string;
  IS_PRIMARY_DOCUMENT?: string;
  USER_NAME?: string;
  DOCUMENT_STATUS?: string;
  ASSIGNED_USER?: string;
  DOCUMENT_DESCRIPTION?: string;
  DOC_SOURCE_FROM?: string;
  DOC_RELATED_TO?: string;
  DOC_RELATED_CATEGORY?: string;
  DOC_REF_VALUE?: string;
  COMMENTS?: string;
  DOC_TAGS?: string;
  FOR_THE_USERS?: string;
  EXPIRY_DATE?: string;
}

interface UserData {
  clientURL: string;
  userEmail: string;
  userName: string;
  isAdmin: boolean;
}

interface DocumentUploadModalProps {
  uploadModalRef: React.RefObject<HTMLDialogElement>;
  selectedDocument: Document;
  onUploadSuccess: () => void;
  onUploadProgress: (progress: number | null) => void;
}

const DocumentUploadModal = ({
  uploadModalRef,
  selectedDocument,
  onUploadSuccess,
  onUploadProgress,
}: DocumentUploadModalProps) => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [existingDocs, setExistingDocs] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [files, setFiles] = useState<
    {
      file: File;
      name: string;
      size: string;
      docExtension: string;
      isPrimaryDocument: boolean;
    }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState("");
  const [fileLoadingStates, setFileLoadingStates] = useState<
    Record<string, string>
  >({});
  const [userViewRights, setUserViewRights] = useState("");

  // Use the document rights hook at the top level
  const {
    hasPermission: hasDeletePermission,
    isLoading: isCheckingDeletePermission,
    error: deletePermissionError,
    checkPermission: checkDeletePermission,
  } = useDocumentRights({
    clientURL: userData.clientURL,
    refSeqNo: selectedDocument?.REF_SEQ_NO || "",
    userId: userData.userName,
    permission: "D",
  });

  // Use document rights hook for view permission
  const {
    hasPermission: hasViewPermission,
    isLoading: isCheckingViewPermission,
    error: viewPermissionError,
    checkPermission: checkViewPermission,
  } = useDocumentRights({
    clientURL: userData.clientURL,
    refSeqNo: selectedDocument?.REF_SEQ_NO || "",
    userId: userData.userName,
    permission: "R",
  });

  // Fetch existing documents and categories
  useEffect(() => {
    fetchData();
    fetchUserViewRights();
  }, [selectedDocument?.REF_SEQ_NO, userData.userEmail]);

  const fetchData = async () => {
    if (!selectedDocument?.REF_SEQ_NO) return;

    setIsLoadingDocs(true);
    setFetchError("");

    try {
      const payload = {
        DataModelName: "synmview_dms_details_all",
        WhereCondition: `REF_SEQ_NO = ${selectedDocument.REF_SEQ_NO}`,
        Orderby: "",
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        payload
      );

      const receivedDocs = Array.isArray(response)
        ? response
        : response?.Data || [];
      setExistingDocs(receivedDocs);
    } catch (err) {
      console.error("Fetch existing docs error:", err);
      setFetchError("Failed to load existing documents");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchUserViewRights = async () => {
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
        title: String(error),
      });
    }
  };

  const allowedMimeTypes = {
    "image/*": [],
    "application/pdf": [],
    "application/vnd.ms-excel": [],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
  };

  const disallowedExtensions = ["exe", "bat", "sh", "msi", "js"];

  const { getRootProps, getInputProps } = useDropzone({
    accept: allowedMimeTypes,
    multiple: true,
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [
        ...prev,
        ...acceptedFiles.map((file) => {
          const ext = file.name.split(".").pop().toLowerCase();
          return {
            file,
            name: file.name,
            size: (file.size / 1024).toFixed(2) + " KB",
            docExtension: ext,
            isPrimaryDocument: false,
          };
        }),
      ]);
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        const file = rejection.file;
        const ext = file.name.split(".").pop().toLowerCase();
        if (disallowedExtensions.includes(ext)) {
          alert(`"${ext}" File format is not allowed.`);
        } else {
          alert(
            `File "${file.name}" was rejected due to MIME type restrictions.`
          );
        }
      });
    },
  });

  const handleSetPrimary = (index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.map((file, i) => ({
        ...file,
        isPrimaryDocument: i === index ? !file.isPrimaryDocument : false,
      }));

      if (
        updatedFiles[index].isPrimaryDocument === false &&
        existingDocs.filter((doc) => doc.IS_PRIMARY_DOCUMENT === "T").length ===
          0
      ) {
        const firstFileIndex = updatedFiles.findIndex((_, i) => i !== index);
        if (firstFileIndex !== -1) {
          updatedFiles[firstFileIndex].isPrimaryDocument = true;
        }
      }

      return updatedFiles;
    });
  };

  const refreshDocuments = async () => {
    try {
      const payload = {
        DataModelName: "SYNM_DMS_DETAILS",
        WhereCondition: `REF_SEQ_NO = ${selectedDocument.REF_SEQ_NO}`,
        Orderby: "",
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        payload
      );
      const updatedDocs = Array.isArray(response)
        ? response
        : response?.Data || [];
      setExistingDocs(updatedDocs);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const canCurrentUserEdit = (doc: Document): string => {
    if (doc?.USER_NAME !== userData.userName)
      return "Access Denied: This document is created by another user.";

    const STATUS = doc?.DOCUMENT_STATUS?.toUpperCase();

    if (STATUS === "VERIFIED")
      return "Access Denied: Document is verified and approved.";
    if (STATUS === "AWAITING FOR USER ACCEPTANCE")
      return `Access Denied: Document is assigned to ${doc.ASSIGNED_USER}.`;
    if (STATUS === "IN PROGRESS")
      return "Access Denied: Document is in progress.";
    if (STATUS === "COMPLETED")
      return "Access Denied: Document has been completed.";
    return "";
  };

  const handleViewDocs = async (selectedDocs: Document) => {
    setCurrentOperation("view");
    setIsLoading(true);
    await checkViewPermission();

    // Check permission result
    if (viewPermissionError || !hasViewPermission) {
      console.log(hasViewPermission);

      setIsLoading(false);
      setCurrentOperation("");
      alert(
        viewPermissionError ||
          "You do not have permission to view this document"
      );
      return;
    }

    const hasAccess = String(userViewRights)?.toLowerCase() === "allowed";

    if (!hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view documents.",
        variant: "destructive",
      });
      return;
    }

    const fileKey = `${selectedDocs.REF_SEQ_NO}-${selectedDocs.SERIAL_NO}`;
    setFileLoadingStates((prev) => ({
      ...prev,
      [fileKey]: "view",
    }));

    try {
      const downloadUrl = `https://apps.istreams-erp.com:4440/api/megacloud/download?email=${encodeURIComponent(
        userData.userEmail
      )}&refNo=${encodeURIComponent(selectedDocs.REF_SEQ_NO)}&fileName=${
        selectedDocs.DOC_NAME
      }`;

      const response = await axios.get(downloadUrl, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        selectedDocs.DOC_NAME || `document_${selectedDocs.REF_SEQ_NO}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
      toast({
        title: "Download Failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setFileLoadingStates((prev) => {
        const newState = { ...prev };
        delete newState[fileKey];
        return newState;
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    setCurrentOperation("delete");
    setIsLoading(true);

    // Optionally re-check permission on click
    try {
      await checkDeletePermission();

      // Check permission result
      if (deletePermissionError || !hasDeletePermission) {
        setIsLoading(false);
        setCurrentOperation("");
        alert(
          deletePermissionError ||
            "You do not have permission to delete this document"
        );
        return;
      }

      const editError = canCurrentUserEdit(doc);
      if (editError) {
        setIsLoading(false);
        setCurrentOperation("");
        alert("Access Denied");
        return;
      }

      if (
        !window.confirm(`Are you sure you want to delete "${doc.DOC_NAME}"?`)
      ) {
        setIsLoading(false);
        setCurrentOperation("");
        return;
      }

      const fileKey = `${doc.REF_SEQ_NO}-${doc.SERIAL_NO}`;
      setFileLoadingStates((prev) => ({
        ...prev,
        [fileKey]: "delete",
      }));

      try {
        toast({
          title: "Deleting Document",
          description: "Please wait while we delete your document...",
          variant: "default",
        });

        const deleteUrl = `https://apps.istreams-erp.com:4440/api/megacloud/delete?email=${encodeURIComponent(
          userData.userEmail
        )}&refNo=${encodeURIComponent(
          doc.REF_SEQ_NO
        )}&fileName=${encodeURIComponent(doc.DOC_NAME)}`;

        const deleteResponse = await axios.delete(deleteUrl);

        if (deleteResponse.status !== 200) {
          throw new Error(
            deleteResponse.data?.message || "File deletion failed"
          );
        }

        const payload = {
          USER_NAME: userData.userName,
          REF_SEQ_NO: doc.REF_SEQ_NO,
          SERIAL_NO: doc.SERIAL_NO,
        };

        await callSoapService(
          userData.clientURL,
          "DMS_Delete_DMS_Detail",
          payload
        );

        toast({
          title: "Success",
          description: "Document deleted successfully",
          variant: "default",
        });

        await refreshDocuments();
        if (onUploadSuccess) onUploadSuccess();
      } catch (err) {
        console.error("Delete error:", err);
        toast({
          title: "Delete Failed",
          description: (err as Error).message || "Failed to delete document",
          variant: "destructive",
        });
      } finally {
        setFileLoadingStates((prev) => {
          const newState = { ...prev };
          delete newState[fileKey];
          return newState;
        });
        setIsLoading(false);
        setCurrentOperation("");
      }
    } catch (err) {
      setIsLoading(false);
      setCurrentOperation("");
      alert("Failed to check permissions");
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one document to upload.",
        variant: "destructive",
      });
      return;
    }

    const editError = canCurrentUserEdit(selectedDocument);
    if (editError) {
      toast({
        title: "Access Denied",
        description: editError,
        variant: "destructive",
      });
      return;
    }

    const existingPrimaryCount = existingDocs.filter(
      (doc) => doc.IS_PRIMARY_DOCUMENT === "T"
    ).length;
    const newPrimaryCount = files.filter(
      (file) => file.isPrimaryDocument
    ).length;

    if (existingPrimaryCount > 0 && newPrimaryCount > 0) {
      toast({
        title: "Invalid Selection",
        description:
          "A primary document already exists. You can only upload supporting documents.",
        variant: "destructive",
      });
      return;
    }

    if (existingPrimaryCount === 0 && newPrimaryCount === 0) {
      toast({
        title: "Invalid Selection",
        description: "You must select one primary document before uploading.",
        variant: "destructive",
      });
      return;
    }

    if (newPrimaryCount > 1) {
      toast({
        title: "Invalid Selection",
        description: "You can only select one primary document at a time.",
        variant: "destructive",
      });
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);
    setIsLoading(true);
    setCurrentOperation("upload");

    try {
      if (onUploadProgress) onUploadProgress(0);

      const email = userData.userEmail;
      const refNo = selectedDocument.REF_SEQ_NO;
      const totalSize = files.reduce((sum, file) => sum + file.file.size, 0);
      let uploadedSize = 0;

      const maxSerial = existingDocs.reduce(
        (max, doc) => Math.max(max, doc.SERIAL_NO || 0),
        0
      );
      let currentSerial = maxSerial;

      for (const [index, file] of files.entries()) {
        currentSerial += 1;

        const formData = new FormData();
        formData.append("file", file.file);
        formData.append("fileName", file.name);
        formData.append("email", email);
        formData.append("refNo", refNo.toString());
        formData.append("isPrimary", file.isPrimaryDocument.toString());
        formData.append("serialNo", currentSerial.toString());

        const uploadUrl = `https://apps.istreams-erp.com:4440/api/megacloud/upload?email=${encodeURIComponent(
          email
        )}&refNo=${encodeURIComponent(refNo)}`;
        const uploadResponse = await axios.post(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            uploadedSize += progressEvent.bytes;
            const progress = Math.round((uploadedSize / totalSize) * 100);
            if (onUploadProgress) onUploadProgress(progress);
          },
        });

        if (uploadResponse.status !== 200) {
          throw new Error(
            `File upload failed with status ${uploadResponse.status}`
          );
        }

        const payload = {
          REF_SEQ_NO: selectedDocument.REF_SEQ_NO,
          SERIAL_NO: currentSerial,
          DOCUMENT_NO: selectedDocument.DOCUMENT_NO || "",
          DOCUMENT_DESCRIPTION: selectedDocument.DOCUMENT_DESCRIPTION || "",
          DOC_SOURCE_FROM: selectedDocument.DOC_SOURCE_FROM || "",
          DOC_RELATED_TO: selectedDocument.DOC_RELATED_TO || "",
          DOC_RELATED_CATEGORY: file.DOC_RELATED_CATEGORY || "",
          DOC_REF_VALUE: selectedDocument.DOC_REF_VALUE || "",
          USER_NAME: userData.userName,
          COMMENTS: selectedDocument.COMMENTS || "",
          DOC_TAGS: selectedDocument.DOC_TAGS || "",
          FOR_THE_USERS: selectedDocument.FOR_THE_USERS || "",
          EXPIRY_DATE: file.EXPIRY_DATE || "",
          DOC_NAME: file.name,
          FILE_PATH: "",
          IsPrimaryDocument: file.isPrimaryDocument,
        };

        await callSoapService(
          userData.clientURL,
          "DMS_CreateAndSave_DMS_Details",
          payload
        );
      }

      addToRecentUploads(files, selectedDocument);
      if (onUploadProgress) onUploadProgress(100);
      await refreshDocuments();
      setFiles([]);
      uploadModalRef.current?.close();
      onUploadSuccess();
    } catch (error) {
      if (onUploadProgress) onUploadProgress(null);
      toast({
        title: "Upload Failed",
        description:
          (error as Error).message ||
          "An error occurred while uploading files.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
      setCurrentOperation("");
    }
  };

  const addToRecentUploads = (
    uploadedFiles: typeof files,
    documentInfo: Document
  ) => {
    const recentUploads = JSON.parse(
      localStorage.getItem("recentUploads") || "[]"
    );
    const newUploads = uploadedFiles.map((file) => ({
      id: uuidv4(),
      fileName: file.name,
      fileExtension: file.name.split(".").pop(),
      refNo: documentInfo.REF_SEQ_NO,
      description: documentInfo.DOCUMENT_DESCRIPTION,
      isPrimary: file.isPrimaryDocument,
      timestamp: new Date().toISOString(),
    }));

    const updatedUploads = [...newUploads, ...recentUploads].slice(0, 20);
    localStorage.setItem("recentUploads", JSON.stringify(updatedUploads));
    return updatedUploads;
  };

  return (
    <dialog ref={uploadModalRef} id="document-upload-form" className="relative">
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center"
        style={{ isolation: "isolate" }}
      >
        <div className="flex flex-col justify-between h-[80%] p-4 w-full max-w-5xl rounded-xl bg-white shadow-xl dark:bg-slate-950 text-gray-900 dark:text-gray-100 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex justify-between items-center w-full text-sm gap-2">
                <span className="flex items-center gap-2 font-semibold">
                  Reference No:
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-sm">
                    {selectedDocument?.REF_SEQ_NO}
                  </span>
                </span>
                <span className="flex items-center gap-2 font-semibold">
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                    {selectedDocument?.DOCUMENT_DESCRIPTION} |{" "}
                    {existingDocs.length} files
                  </span>
                </span>
              </div>
              <button
                className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => uploadModalRef.current?.close()}
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Separator className="my-4" />
            
            {fetchError && (
              <div className="alert alert-error mb-1">
                <span>{fetchError}</span>
              </div>
            )}

            <div
              className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Drag & drop files or click to select
              </p>
            </div>

            {isLoadingDocs ? (
              <p>Loading...</p>
            ) : existingDocs.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {existingDocs.map((doc) => {
                  const fileKey = `${doc.REF_SEQ_NO}-${doc.SERIAL_NO}`;
                  const isFileLoading = fileLoadingStates[fileKey];
                  const docExtension =
                    doc.DOC_EXT || doc.DOC_NAME?.split(".").pop() || "";

                  return (
                    <div key={fileKey} className="w-72">
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
                                  title={doc.DOC_NAME}
                                >
                                  {doc.DOC_NAME.length > 24
                                    ? doc.DOC_NAME.slice(0, 24) + "..."
                                    : doc.DOC_NAME}
                                </h5>
                                <div className="text-xs mt-1 flex items-center gap-2">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {docExtension?.toUpperCase() || "Unknown"}
                                  </span>
                                  {doc.IS_PRIMARY_DOCUMENT === "T" && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                      Primary
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 items-center">
                              <button
                                onClick={() => handleViewDocs(doc)}
                                title="View"
                                disabled={isFileLoading}
                                className="p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                              >
                                {isFileLoading === "view" ? (
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(doc)}
                                title="Delete"
                                disabled={
                                  isFileLoading || isCheckingDeletePermission
                                }
                                className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 dark:hover:text-red-400"
                              >
                                {isFileLoading === "delete" ||
                                isCheckingDeletePermission ? (
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : (
                                  <XIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-center text-gray-500 my-4">
                No documents found for this reference
              </div>
            )}

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="w-72 m-1 p-2">
                    <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
                      <div className="card-body p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex gap-3 items-center">
                            <img
                              src={getFileIcon(file.docExtension)}
                              alt={file.name}
                              className="w-8 h-8 object-contain rounded"
                            />
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block max-w-[180px]"
                                title={file.name}
                              >
                                {file.name.length > 24
                                  ? file.name.slice(0, 24) + "..."
                                  : file.name}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {file.size}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setFiles((f) => f.filter((_, i) => i !== index))
                            }
                            className="btn btn-sm btn-circle btn-ghost p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 pt-2 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                name="primaryDoc"
                                className="sr-only peer"
                                checked={file.isPrimaryDocument}
                                onChange={() => handleSetPrimary(index)}
                                disabled={existingDocs.some(
                                  (doc) => doc.IS_PRIMARY_DOCUMENT === "T"
                                )}
                              />
                              <div className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:border-blue-500 transition-all">
                                {file.isPrimaryDocument && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-sm ${
                                existingDocs.some(
                                  (doc) => doc.IS_PRIMARY_DOCUMENT === "T"
                                )
                                  ? "text-gray-400 dark:text-gray-500"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              Primary Document
                            </span>
                          </label>
                          {file.isPrimaryDocument && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 w-full mt-5">
            <Button
              variant="outline"
              onClick={() => uploadModalRef.current?.close()}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isSubmitting}>
              {isSubmitting ? (
                <>Uploading...</>
              ) : (
                `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-500 mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-700 dark:text-gray-300">
              {currentOperation === "upload" && "Uploading files..."}
              {currentOperation === "delete" && "Deleting document..."}
              {currentOperation === "view" && "Preparing download..."}
            </p>
          </div>
        </div>
      )}
    </dialog>
  );
};

export default DocumentUploadModal;
