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
  Clock3,
  FileQuestion,
  FileText,
  Folder,
  Hash,
  Link,
  Loader,
  Loader2,
  LocateFixed,
  MessageSquare,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { convertServiceDate } from "../../utils/dateUtils";
import DocumentPreview from "../DocumentPreview";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import RejectModal from "./RejectModal";

const DocumentFormModal = ({
  formModalRef,
  selectedDocument,
  docMode,
  onSuccess,
  onUploadSuccess,
}) => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const rejectModalRef = useRef(null);

  // Centralized initial form state
  const initialFormState = {
    REF_SEQ_NO: -1,
    DOCUMENT_NO: "",
    DOCUMENT_DESCRIPTION: "",
    DOC_SOURCE_FROM: "",
    DOC_RELATED_TO: "",
    DOC_RELATED_CATEGORY: "",
    DOC_REF_VALUE: "",
    DOC_TAGS: "",
    COMMENTS: "",
    EXPIRY_DATE: "",
    ENT_DATE: new Date().toISOString().split("T")[0],
    REF_TASK_ID: 0,
    FOR_THE_USERS: "",
    USER_NAME: userData.userName,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [isLoadingDynamicFields, setIsLoadingDynamicFields] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(null);

  // Set read-only based on document mode
  useEffect(() => {
    if (docMode === "view" || docMode === "verify") {
      setIsReadOnly(true);
    } else {
      setIsReadOnly(false);
    }
  }, [docMode]);

  // Populate form with selected document data
  useEffect(() => {
    if (selectedDocument && selectedDocument.REF_SEQ_NO !== -1) {
      const convertedExpiryDate = convertServiceDate(
        selectedDocument.EXPIRY_DATE
      );
      setFormData((prev) => ({
        ...prev,
        ...initialFormState,
        ...selectedDocument,
        EXPIRY_DATE: convertedExpiryDate,
      }));
    } else {
      setFormData(initialFormState);
    }
  }, [selectedDocument, userData.userName]);

  // Fetch category list on component mount
  useEffect(() => {
    fetchCategoryList();
  }, []);

  const fetchCategoryList = async () => {
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
  };

  console.log(selectedDocument);

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
    formData.DOC_RELATED_CATEGORY,
    selectedDocument,
    userData.clientURL,
    toast,
  ]);

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validate required fields
  const validateForm = () => {
    const newErrors = {};
    if (!formData.DOCUMENT_NO.trim())
      newErrors.DOCUMENT_NO = "Document Ref No is required";
    if (!formData.DOCUMENT_DESCRIPTION.trim())
      newErrors.DOCUMENT_DESCRIPTION = "Document Name is required";
    if (!formData.DOC_RELATED_TO.trim())
      newErrors.DOC_RELATED_TO = "Related To is required";
    if (!formData.DOC_RELATED_CATEGORY.trim())
      newErrors.DOC_RELATED_CATEGORY = "Related Category is required";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

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

  const canCurrentUserEdit = (doc) => {
    if (!doc) return "";
    if (doc?.USER_NAME !== userData.userName)
      return "Access Denied: This document is created by another user.";
    const status = doc?.DOCUMENT_STATUS?.toUpperCase();
    if (status === "VERIFIED")
      return "Access Denied: Document is verified and approved.";
    if (status === "AWAITING FOR USER ACCEPTANCE")
      return `Access Denied: Document is assigned to ${doc.ASSIGNED_USER}.`;
    if (status === "IN PROGRESS")
      return "Access Denied: Document is in progress.";
    if (status === "COMPLETED")
      return "Access Denied: Document has been completed.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const editError = canCurrentUserEdit(selectedDocument);
    if (editError) {
      alert(editError);
      return;
    }
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      const convertedDataModel = convertDataModelToStringData(
        "SYNM_DMS_MASTER",
        formData
      );
      const payload = {
        UserName: userData.userEmail,
        DModelData: convertedDataModel,
      };
      const response = await callSoapService(
        userData.clientURL,
        "DataModel_SaveData",
        payload
      );
      toast({
        title: "Success",
        description: response,
      });
      if (onUploadSuccess) onUploadSuccess();
      formModalRef.current?.close();
      setFormData(initialFormState);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save document.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <dialog
        ref={formModalRef}
        id="document-form"
        name="document-form"
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
                <span className="ml-2 px-1 py-0 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {formData.REF_SEQ_NO === -1 ? "(New)" : formData.REF_SEQ_NO}
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
            <form
              onSubmit={handleSubmit}
              id="document-form"
              name="document-form"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Left Side - Document Form and Others Details */}
                <div className="col-span-3 lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Document Number */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="DOCUMENT_NO">Document Ref No</Label>
                        <div className="text-gray-400 cursor-help">
                          <FileQuestion className="w-4 h-4" />
                        </div>
                      </div>
                      <Input
                        type="text"
                        name="DOCUMENT_NO"
                        id="DOCUMENT_NO"
                        placeholder="Enter document ref no"
                        value={formData.DOCUMENT_NO}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                      />
                      {errors.DOCUMENT_NO && (
                        <p className="text-red-500 text-sm">
                          {errors.DOCUMENT_NO}
                        </p>
                      )}
                    </div>
                    {/* Document Name */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="DOCUMENT_DESCRIPTION">
                          Document Name
                        </Label>
                      </div>
                      <Input
                        type="text"
                        name="DOCUMENT_DESCRIPTION"
                        id="DOCUMENT_DESCRIPTION"
                        placeholder="Enter document name"
                        value={formData.DOCUMENT_DESCRIPTION}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                      />
                      {errors.DOCUMENT_DESCRIPTION && (
                        <p className="text-red-500 text-sm">
                          {errors.DOCUMENT_DESCRIPTION}
                        </p>
                      )}
                    </div>
                    {/* Related To */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Link className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="DOC_RELATED_TO">Related To</Label>
                      </div>
                      <select
                        name="DOC_RELATED_TO"
                        value={formData.DOC_RELATED_TO}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className="w-full rounded-md border border-gray-300 p-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:text-gray-400"
                      >
                        <option
                          value=""
                          disabled
                          className="text-gray-400 dark:text-gray-500"
                        >
                          Select related to
                        </option>
                        <optgroup label="Related To" className="font-semibold">
                          <option value="HRMS & Payroll">HRMS & Payroll</option>
                          <option value="Material Management">
                            Material Management
                          </option>
                          <option value="Accounting">Accounting</option>
                          <option value="Sales (POS)">Sales (POS)</option>
                          <option value="Estimation">Estimation</option>
                          <option value="Projects">Projects</option>
                          <option value="Job Costing">Job Costing</option>
                          <option value="Production">Production</option>
                          <option value="Packing Delivery">
                            Packing Delivery
                          </option>
                          <option value="Task Management">
                            Task Management
                          </option>
                          <option value="Documents & Communications">
                            Documents & Communications
                          </option>
                          <option value="Product Administration">
                            Product Administration
                          </option>
                        </optgroup>
                      </select>
                      {errors.DOC_RELATED_TO && (
                        <p className="text-red-500 text-sm">
                          {errors.DOC_RELATED_TO}
                        </p>
                      )}
                    </div>
                    {/* Related Category */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Folder className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="DOC_RELATED_CATEGORY">
                          Related Category
                        </Label>
                      </div>
                      <select
                        name="DOC_RELATED_CATEGORY"
                        value={formData.DOC_RELATED_CATEGORY}
                        onChange={handleCategoryChange}
                        disabled={isReadOnly}
                        className="w-full rounded-md border border-gray-300 p-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:disabled:text-gray-400"
                      >
                        <option
                          value=""
                          disabled
                          className="text-gray-400 dark:text-gray-500"
                        >
                          Select category
                        </option>
                        <optgroup label="Categories" className="font-semibold">
                          {Array.isArray(categoryList) &&
                          categoryList.length === 0 ? (
                            <option value="" disabled>
                              No categories assigned for you
                            </option>
                          ) : (
                            categoryList.map((category, index) =>
                              category?.CATEGORY_NAME ? (
                                <option
                                  key={`${category.CATEGORY_NAME}-${index}`}
                                  value={category.CATEGORY_NAME}
                                >
                                  {category.CATEGORY_NAME}
                                </option>
                              ) : null
                            )
                          )}
                        </optgroup>
                      </select>
                      {errors.DOC_RELATED_CATEGORY && (
                        <p className="text-red-500 text-sm">
                          {errors.DOC_RELATED_CATEGORY}
                        </p>
                      )}
                    </div>
                    {/* Expiry Date */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="EXPIRY_DATE">Expiry Date</Label>
                      </div>
                      <Input
                        type="date"
                        name="EXPIRY_DATE"
                        id="EXPIRY_DATE"
                        value={formData.EXPIRY_DATE}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        readOnly={isReadOnly}
                      />
                    </div>
                    {/* Document Reference For */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <LocateFixed className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="DOC_REF_VALUE">
                          Document Reference For
                        </Label>
                      </div>
                      <Input
                        type="text"
                        name="DOC_REF_VALUE"
                        id="DOC_REF_VALUE"
                        placeholder="ex: emp no, project no etc."
                        value={formData.DOC_REF_VALUE}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                      />
                    </div>
                    {/* Document Tags */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <LocateFixed className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="DOC_TAGS">
                          Document Tags For Filter
                        </Label>
                      </div>
                      <Input
                        type="text"
                        name="DOC_TAGS"
                        id="DOC_TAGS"
                        placeholder="Enter docs ref no"
                        value={formData.DOC_TAGS}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                      />
                    </div>
                    {/* Remarks */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="COMMENTS">Remarks</Label>
                      </div>
                      <Textarea
                        name="COMMENTS"
                        id="COMMENTS"
                        placeholder="Add remarks"
                        value={formData.COMMENTS}
                        onChange={handleChange}
                        readOnly={isReadOnly}
                      />
                    </div>
                    {/* Others Details Section Moved to Left Side */}
                    <div className="col-span-2 space-y-1 bg-slate-200 rounded-lg p-2">
                      <h2 className="text-sm font-medium mb-2">
                        Others Details:
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-1 text-gray-500">
                            <UserRound className="h-4 w-4" />
                            <label className="text-sm">Uploader Name</label>
                          </div>
                          <p className="text-sm font-medium">
                            {formData.REF_SEQ_NO === -1
                              ? userData.userName
                              : selectedDocument.USER_NAME}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-1 text-gray-500">
                            <LocateFixed className="h-4 w-4" />
                            <label className="text-sm">
                              Document Received From
                            </label>
                          </div>
                          <p className="text-sm font-medium">
                            {formData.DOC_SOURCE_FROM}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-1 text-gray-500">
                            <LocateFixed className="h-4 w-4" />
                            <label className="text-sm">Verified by</label>
                          </div>
                          <p className="text-sm font-medium">
                            {formData.VERIFIED_BY}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock3 className="h-4 w-4" />
                            <label className="text-sm">Verified date</label>
                          </div>
                          <p className="text-sm font-medium">
                            {convertServiceDate(formData.VERIFIED_DATE)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-1 text-gray-500">
                            <LocateFixed className="h-4 w-4" />
                            <label className="text-sm">Reference Task ID</label>
                          </div>
                          <p className="text-sm font-medium">
                            {formData.REF_TASK_ID}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Loader className="h-4 w-4" />
                            <label className="text-sm whitespace-nowrap">
                              Document Status
                            </label>
                          </div>
                          {formData.DOCUMENT_STATUS && (
                            <p
                              className="text-xs font-medium truncate w-full whitespace-nowrap"
                              title={formData.DOCUMENT_STATUS}
                            >
                              {formData.DOCUMENT_STATUS}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {!docMode && (
                    <div className="mt-4 flex justify-end">
                      <Button type="submit" disabled={isSubmitting}>
                        {formData.REF_SEQ_NO === -1
                          ? "Create Document"
                          : "Save Changes"}
                        {isSubmitting && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {/* Right Side - Dynamic Fields */}
                <div className="col-span-3 lg:col-span-1 bg-slate-200 transition-colors dark:bg-slate-900 p-2 rounded-lg space-y-2">
                  <h2 className="text-sm font-medium mb-2">Dynamic Fields:</h2>
                  {isLoadingDynamicFields ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : dynamicFields.length > 0 ? (
                    dynamicFields.map((field) => (
                      <div key={field.COLUMN_NAME} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <Label htmlFor={field.COLUMN_NAME}>
                            {field.COLUMN_LABEL}
                            {field.REQUIRED && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                        </div>
                        <Input
                          type={field.INPUT_TYPE}
                          name={field.COLUMN_NAME}
                          id={field.COLUMN_NAME}
                          placeholder={`Enter ${field.COLUMN_LABEL}`}
                          value={formData[field.COLUMN_NAME] || ""}
                          onChange={handleChange}
                          readOnly={isReadOnly}
                          required={field.REQUIRED}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No dynamic fields available for this category.
                    </p>
                  )}
                  {docMode === "verify" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        type="button"
                        onClick={handleVerifyApprove}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <CircleCheckBig size={18} />
                        Verify & Approve
                      </Button>
                      <Button
                        type="button"
                        onClick={handleReject}
                        className="flex items-center gap-2 px-4 py-2 bg-transparent border border-red-600 text-red-600 rounded hover:bg-red-300"
                      >
                        <X size={18} />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
                {/* Document Preview Section */}
                {docMode === "view" || docMode === "verify" ? (
                  isLoadingDocs ? (
                    <div className="col-span-3">
                      <p className="text-sm">Loading documents...</p>
                    </div>
                  ) : existingDocs.length > 0 ? (
                    <div className="col-span-3">
                      <Separator className="my-4" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {existingDocs.map((doc) => (
                          <div
                            key={`${doc.REF_SEQ_NO}-${doc.SERIAL_NO}`}
                            className="cust-card-group p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <img
                                  src={getFileIcon(doc.DOC_EXT)}
                                  alt={doc.DOC_NAME}
                                  className="w-8 h-8 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium md:truncate break-words">
                                    {doc.DOC_NAME.length > 24
                                      ? doc.DOC_NAME.substring(0, 23) + "..."
                                      : doc.DOC_NAME}
                                  </h5>
                                  <div className="text-xs text-gray-400">
                                    <span>Type: {doc.DOC_EXT}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handlePreview(doc)}
                                  type="button"
                                >
                                  Preview
                                </Button>
                                <Button
                                  onClick={() => handleViewDocs(doc)}
                                  type="button"
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-3 text-xs text-center text-gray-500">
                      <Separator />
                      No documents found for this reference no
                    </div>
                  )
                ) : null}
                {currentPreviewUrl && (
                  <div className="col-span-3 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Preview</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => setCurrentPreviewUrl(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <DocumentPreview
                      fileUrl={currentPreviewUrl}
                      className="h-96"
                    />
                  </div>
                )}
              </div>
            </form>
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

export default DocumentFormModal;
