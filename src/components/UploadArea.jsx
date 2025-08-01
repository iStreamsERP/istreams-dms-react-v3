import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CloudUpload, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createDocument } from "@/app/actions";
import { useAuth } from "@/contexts/AuthContext";

export default function UploadArea({
  theme,
  isUploading,
  handleFileUpload,
  errorMessage,
}) {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const dispatch = useDispatch();
  const { userData } = useAuth();
  const selectedType = useSelector((state) => state.selectedType);
  const analysisSummary = useSelector((state) => state.analysisSummary);
  const localQuestions = useSelector((state) => state.localQuestions);
  const file = useSelector((state) => state.file);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleAddToLibrary = async () => {
    if (!file || !selectedType || analysisSummary.length === 0) {
      return;
    }
    await dispatch(
      createDocument(
        file,
        selectedType,
        analysisSummary,
        localQuestions,
        userData.clientURL,
        userData.userEmail
      )
    );
    setSelectedFiles(null); // Reset to allow new upload
    fileInputRef.current.value = ""; // Clear file input
  };

  return (
    <div className="flex justify-center gap-16">
      <div className="w-1/2 flex flex-col items-end">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />

        <div className="flex flex-col items-center">
          <div
            onClick={handleClick}
            className="relative rounded-full w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              background:
                theme === "dark"
                  ? "radial-gradient(circle, rgba(56,189,248,0.1) 0%, rgba(20,184,166,0.2) 100%), radial-gradient(circle at 30% 30%, rgba(6,182,212,0.4) 0%, rgba(8,145,178,0.2) 20%, transparent 60%), #0f172a"
                  : "radial-gradient(circle, rgba(56,189,248,0.08) 0%, rgba(20,184,166,0.15) 100%), radial-gradient(circle at 30% 30%, rgba(6,182,212,0.2) 0%, rgba(8,145,178,0.1) 20%, transparent 60%), #ffffff",
            }}
          >
            <div className="flex flex-col items-center justify-center w-full h-full p-6">
              <motion.div
                className="relative w-16 h-16 mb-4"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0, -5, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <div className="absolute inset-0 rounded-full bg-cyan-200/50 dark:bg-cyan-500/10 backdrop-blur-sm"></div>
                <div className="absolute inset-2 flex items-center justify-center">
                  <CloudUpload className="w-10 h-10 text-cyan-500 dark:text-cyan-300" />
                </div>
              </motion.div>
              <motion.h3
                className="text-base font-medium text-cyan-700 dark:text-cyan-100 mb-2 text-center"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                Drag & drop files
              </motion.h3>
              <Button
                onClick={handleClick}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white flex items-center gap-2"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Browse Files</span>
              </Button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-red-500 mt-2">{errorMessage}</p>
          )}

          <div className="mt-4 text-center text-cyan-700 dark:text-cyan-200 max-w-md">
            <p className="mb-1 text-xs">
              Smart AI assistance for managing and analyzing your documents
            </p>
            <p className="text-xs opacity-75">
              Auto-tagging • Context-aware search • Document insights
            </p>
          </div>
        </div>
      </div>

      {selectedFiles && (
        <div className="w-1/2 flex flex-col justify-start items-start">
          <h1 className="text-green-500 text-sm">
            Document{selectedFiles.length > 1 ? "s" : ""} uploaded successfully!
          </h1>

          <div className="flex flex-col items-center gap-2">
            <h2>What would you like to do?</h2>
            <Button
              onClick={() => handleFileUpload(selectedFiles)}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Document...
                </>
              ) : (
                `Analyze this document${selectedFiles.length > 1 ? "s" : ""}`
              )}
            </Button>

            <div className="text-center">or</div>

            <Button
              variant="outline"
              onClick={handleAddToLibrary}
              disabled={isUploading || !selectedType || analysisSummary.length === 0}
            >
              Add another to library
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}