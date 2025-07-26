import { useToast } from "@/hooks/useToast";
import { callSoapService } from "@/api/callSoapService";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const RejectModal = ({ rejectModalRef, selectedDocument, onClose }) => {
  const { userData } = useAuth();
  const { toast } = useToast();

  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReject = async (selectedDocument) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to reject the document: ${selectedDocument?.DOC_NAME}?`
    );

    if (!isConfirmed) return;

    if (!remarks.trim()) {
      toast({
        title: "Error",
        description: "Please enter remarks before rejecting the document.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        REF_SEQ_NO: selectedDocument?.REF_SEQ_NO,
        CURRENT_USER_NAME: userData?.userName,
        DOCUMENT_DESCRIPTION: selectedDocument?.DOCUMENT_DESCRIPTION,
        DOCUMENT_USER_NAME: selectedDocument?.USER_NAME,
        REJECTION_REMARKS: remarks,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DMS_Update_Rejection",
        payload
      );

      if (response) {
        alert("Document rejected successfully!");
        rejectModalRef?.current?.close();
        setRemarks("");
      } else {
        setError("Failed to reject document. Please try again.");
      }

      onClose();
    } catch (error) {
      setError("Failed to reject document. Please try again.", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog
      ref={rejectModalRef}
      id="reject-document"
      className="modal modal-bottom sm:modal-middle rounded-2xl bg-white dark:bg-gray-800 backdrop-blur-sm"
    >
      <div className="modal-box w-full max-w-5xl mx-auto p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
        <div className="flex items-start mb-3">
          <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Reject Document
            </h3>
            <p className="text-sm text-gray-500 ">
              Please provide a reason for rejecting:{" "}
              <b className="text-gray-700">{selectedDocument?.DOC_NAME}</b>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="rejection-remarks"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Rejection Remarks
            </label>
            <textarea
              id="rejection-remarks"
              className="textarea w-full h-32 p-3 text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-600 dark:text-white text-sm border bg-transparent border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              placeholder="Enter detailed rejection remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            ></textarea>
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-action flex justify-end w-full gap-3 mt-6">
            <button
              type="button"
              className="btn btn-ghost p-2 w-full border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white   hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={() => onClose()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn p-2 w-full border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 dark:focus:ring-offset-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleReject(selectedDocument)}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Rejecting...
                </span>
              ) : (
                "Reject Document"
              )}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default RejectModal;