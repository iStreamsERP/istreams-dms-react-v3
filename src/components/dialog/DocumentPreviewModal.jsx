import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { callSoapService } from "@/api/callSoapService";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";
import { getFileIcon } from "@/utils/getFileIcon";
import {
  CalendarDays,
  CircleCheckBig,
  Download,
  Eye,
  FileText,
  Folder,
  Hash,
  Link,
  ListOrdered,
  Loader,
  Loader2,
  LocateFixed,
  MessageSquare,
  Target,
  UserRound,
  Verified,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { convertServiceDate } from "../../utils/dateUtils";
import DocumentPreview from "../DocumentPreview";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import RejectModal from "./RejectModal";

const DocumentPreviewModal = ({
  formModalRef,
  selectedDocument,
  docMode,
  onSuccess,
  onUploadSuccess,
}) => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const rejectModalRef = useRef(null);

  const [existingDocs, setExistingDocs] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [isLoadingDynamicFields, setIsLoadingDynamicFields] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(null);

  // Fetch existing documents
  useEffect(() => {
    fetchExistingDocument();
  }, [selectedDocument?.REF_SEQ_NO, userData.userEmail]);

  const fetchExistingDocument = async () => {
    if (!selectedDocument?.REF_SEQ_NO) return;
    try {
      setIsLoadingDocs(true);
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
      setExistingDocs(response || []);
    } catch (err) {
      toast({
        title: "Failed to fetch existing documents.",
        description: err.message || "Error",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Fetch dynamic fields from SYNM_DMS_DOC_VALUES based on selected category
  useEffect(() => {
    const fetchDynamicFields = async () => {
      if (!formData.DOC_RELATED_CATEGORY) {
        setDynamicFields([]);
        return;
      }
      try {
        setIsLoadingDynamicFields(true);
        let sqlQuery;

        // Case 1: New document (selectedDocument is undefined or REF_SEQ_NO is undefined or -1)
        if (
          !selectedDocument ||
          selectedDocument.REF_SEQ_NO === undefined ||
          selectedDocument.REF_SEQ_NO === -1
        ) {
          // Fetch REF_KEY from SYNM_DMS_DOC_CATG_QA for the selected category
          sqlQuery = `SELECT DISTINCT REF_KEY FROM SYNM_DMS_DOC_CATG_QA WHERE CATEGORY_NAME = '${formData.DOC_RELATED_CATEGORY}'`;
        } else {
          // Case 2: Existing document with a valid REF_SEQ_NO
          sqlQuery = `SELECT REF_KEY, REF_VALUE FROM SYNM_DMS_DOC_VALUES WHERE CATEGORY_NAME = '${formData.DOC_RELATED_CATEGORY}' AND REF_SEQ_NO = ${selectedDocument.REF_SEQ_NO}`;
        }

        const payload = {
          SQLQuery: sqlQuery,
        };

        const response = await callSoapService(
          userData.clientURL,
          "DataModel_GetDataFrom_Query",
          payload
        );

        const fields = (response || []).map((item) => ({
          COLUMN_NAME: item.REF_KEY,
          COLUMN_LABEL: item.REF_KEY.replace(/_/g, " ").replace(/\b\w/g, (c) =>
            c.toUpperCase()
          ),
          INPUT_TYPE: "text",
          REQUIRED: false,
          VALUE:
            !selectedDocument ||
              selectedDocument.REF_SEQ_NO === undefined ||
              selectedDocument.REF_SEQ_NO === -1
              ? ""
              : item.REF_VALUE || "",
        }));

        setDynamicFields(fields);
        setFormData((prev) => ({
          ...prev,
          ...fields.reduce(
            (acc, field) => ({
              ...acc,
              [field.COLUMN_NAME]:
                selectedDocument?.[field.COLUMN_NAME] || field.VALUE || "",
            }),
            {}
          ),
        }));
      } catch (error) {
        console.error("Error fetching dynamic fields:", error);
        setDynamicFields([]);
        toast({
          title: "Error",
          description: "Failed to load dynamic fields.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDynamicFields(false);
      }
    };

    fetchDynamicFields();
  }, [
    //formData.DOC_RELATED_CATEGORY,
    selectedDocument,
    userData.clientURL,
    toast,
  ]);

  const handleViewDocs = async (selectedDocs) => {
    try {
      const payload = {
        DataModelName: "SYNM_DMS_DETAILS",
        WhereCondition: `REF_SEQ_NO = ${selectedDocs.REF_SEQ_NO} AND SERIAL_NO = ${selectedDocs.SERIAL_NO}`,
        Orderby: "",
      };
      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        payload
      );
      if (!response?.length) {
        throw new Error("No documents found.");
      }
      const doc = response[0];
      if (Array.isArray(doc.DOC_DATA)) {
        const blob = new Blob([new Uint8Array(doc.DOC_DATA)], {
          type: "application/octet-stream",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          doc.DOC_NAME || `document_${selectedDocs.REF_SEQ_NO}.bin`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error downloading documents:", err);
      toast({
        title: "Error",
        description: "Failed to download document.",
      });
    }
  };

  const handlePreview = useCallback((doc) => {
    const byteArray = new Uint8Array(doc.DOC_DATA);
    const mimeType =
      {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ppt: "application/vnd.ms-powerpoint",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        xls: "application/vnd.ms-excel",
        docx: "applicationsqapplication/vnd.openxmlformats-officedocument.wordprocessingml.document",
        doc: "application/msword",
        webp: "image/webp",
      }[doc.DOC_EXT.toLowerCase()] || "application/octet-stream";
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    setCurrentPreviewUrl(url);
  }, []);

  const handleVerifyApprove = async () => {
    try {
      const payload = {
        USER_NAME: userData.userName,
        REF_SEQ_NO: selectedDocument.REF_SEQ_NO,
      };
      const response = await callSoapService(
        userData.clientURL,
        "DMS_Update_VerifiedBy",
        payload
      );
      if (response === "SUCCESS") {
        onSuccess(selectedDocument.REF_SEQ_NO, userData.userName);
      }
    } catch (error) {
      console.error("Verification failed:", error);
      toast({
        title: "Error",
        description: "Verification failed.",
        variant: "destructive",
      });
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  useEffect(() => {
    if (showRejectModal && rejectModalRef.current) {
      rejectModalRef.current.showModal();
    }
  }, [showRejectModal]);

  return (
    <>
      <dialog
        ref={formModalRef}
        className="relative"
      >
        <div
          className="fixed inset-0 bg-black/50"
          aria-hidden="true"
          style={{ isolation: "isolate" }}
        />
        <div className="fixed inset-0 flex items-center justify-center p-2 z-50">
          <div className="bg-white shadow-xl dark:bg-slate-950 text-gray-900 dark:text-gray-100 p-4 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                Reference ID:
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {selectedDocument?.REF_SEQ_NO || "N/A"}
                </span>
              </h3>
              <button
                className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => formModalRef.current.close()}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Separator className="my-2" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - Document Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Document Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Document Ref No:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.DOCUMENT_NO || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Document Name:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.DOCUMENT_DESCRIPTION || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Related Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Related To:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.DOC_RELATED_TO || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Category:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.DOC_RELATED_CATEGORY || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Expiry Date:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.EXPIRY_DATE ? convertServiceDate(selectedDocument.EXPIRY_DATE) : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* References */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <LocateFixed className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Reference For:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.DOC_REF_VALUE || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Other Details */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-3">Other Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        <span className="text-sm">Uploader Name:</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-200">
                        {selectedDocument?.USER_NAME || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LocateFixed className="h-4 w-4" />
                        <span className="text-sm">Source:</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.DOC_SOURCE_FROM || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Verified className="h-4 w-4" />
                        <span className="text-sm">Verified by:</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.VERIFIED_BY || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-sm">Verified date:</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.VERIFIED_DATE ? convertServiceDate(selectedDocument.VERIFIED_DATE) : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListOrdered className="h-4 w-4" />
                        <span className="text-sm">Task ID:</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.REF_TASK_ID || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span className="text-sm">Status:</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDocument?.DOCUMENT_STATUS || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                {selectedDocument?.COMMENTS && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Remarks:</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-6">
                      {selectedDocument.COMMENTS}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Dynamic Fields */}
              <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Dynamic Fields</h4>
                {isLoadingDynamicFields ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : dynamicFields.length > 0 ? (
                  <div className="space-y-3">
                    {dynamicFields.map((field) => (
                      <div key={field.COLUMN_NAME}>
                        <label className="block text-sm mb-1">
                          {field.COLUMN_LABEL}
                        </label>
                        <Input
                          type="text"
                          value={field.VALUE}
                          readOnly
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No dynamic fields available
                  </p>
                )}

                {docMode === "verify" && (
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button
                      onClick={handleVerifyApprove}
                      className="flex-1"
                    >
                      <CircleCheckBig className="h-4 w-4 mr-2" />
                      Verify & Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReject}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Files Section */}
            <div className="mt-6">
              <Separator className="mb-4" />
              {isLoadingDocs ? (
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : existingDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {existingDocs.map((doc) => (
                    <div
                      key={`${doc.REF_SEQ_NO}-${doc.SERIAL_NO}`}
                      className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <img
                            src={getFileIcon(doc.DOC_EXT)}
                            alt={doc.DOC_NAME}
                            className="w-8 h-8 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-sm font-medium truncate">
                              {doc.DOC_NAME}
                            </h5>
                            <p className="text-xs text-gray-500">
                              {doc.DOC_EXT}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePreview(doc)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewDocs(doc)}
                            className="p-1 text-gray-500 hover:text-green-600"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500">
                  No documents found
                </p>
              )}
            </div>

            {/* Document Preview */}
            {currentPreviewUrl && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Document Preview</h4>
                  <button
                    onClick={() => setCurrentPreviewUrl(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <DocumentPreview
                    fileUrl={currentPreviewUrl}
                    className="h-96"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </dialog>
      {showRejectModal && (
        <RejectModal
          rejectModalRef={rejectModalRef}
          selectedDocument={selectedDocument}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
};

export default DocumentPreviewModal;