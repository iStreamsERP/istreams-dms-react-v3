import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react"; // Add useState
import { useDispatch, useSelector } from "react-redux";
import { useOutletContext } from "react-router-dom";
import AnalysisView from "@/components/AnalysisView";
import PageHeader from "@/components/PageHeader";
import UploadArea from "@/components/UploadArea";
import {
  uploadFile,
  setSelectedType,
  setDocumentAnalysis,
  setAnalysisSummary,
  clearLocalQuestions,
} from "@/app/actions";
import { useTheme } from "@/contexts/ThemeProvider";

export const UploadDocumentPage = () => {
  const { uploadRef } = useOutletContext();
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const documentAnalysis = useSelector((state) => state.documentAnalysis);
  const isLoading = useSelector((state) => state.isLoading);
  const error = useSelector((state) => state.error);
  const file = useSelector((state) => state.file); // Retrieve file from Redux
  const [previewUrl, setPreviewUrl] = useState(null); // State for previewUrl

  // Generate previewUrl when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Clean up URL when component unmounts or file changes
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFileUpload = (files) => {
    if (!files || files.length === 0 || !(files[0] instanceof File)) {
      dispatch(setError("Please select a valid file"));
      return;
    }
    dispatch(uploadFile(files[0]));
  };

  const handleReset = () => {
    dispatch(setDocumentAnalysis(null));
    dispatch(setSelectedType(""));
    dispatch(setAnalysisSummary([]));
    dispatch(clearLocalQuestions());
    dispatch(setError(""));
    setPreviewUrl(null); // Clear previewUrl on reset
  };

  useEffect(() => {
    if (uploadRef) {
      uploadRef.current = { reset: handleReset };
    }
  }, [uploadRef]);

  return (
    <div className="h-[92vh] w-full bg-white dark:bg-slate-900">
      <PageHeader showAnalysis={!!documentAnalysis} />

      <AnimatePresence>
        {documentAnalysis && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-teal-100 dark:bg-teal-800 border border-teal-300 dark:border-teal-600 rounded-lg text-teal-800 dark:text-teal-100 flex items-center justify-center text-sm sm:text-base"
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Upload completed! Analyzing document...
          </motion.div>
        )}
      </AnimatePresence>

      {!documentAnalysis ? (
        <UploadArea
          theme={theme}
          isUploading={isLoading}
          handleFileUpload={handleFileUpload}
          errorMessage={error}
        />
      ) : (
        <AnalysisView
          file={file}
          previewUrl={previewUrl}
          documentAnalysis={documentAnalysis}
          isLoadingTranslation={isLoading} // Adjust if you have a specific isLoadingTranslation state
        />
      )}
    </div>
  );
};
