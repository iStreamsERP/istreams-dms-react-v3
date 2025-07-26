// components/UploadArea.jsx
import { motion } from "framer-motion";
import { CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

export default function UploadArea({
  theme,
  isUploading,
  handleFileUpload,
  errorMessage,
}) {
  const fileInputRef = useRef(null);

  const handleClick = () => fileInputRef.current?.click();
  
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      <div
        onClick={handleClick}
        className="relative rounded-full w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          background: theme === "dark" 
            ? "radial-gradient(circle, rgba(56,189,248,0.1) 0%, rgba(20,184,166,0.2) 100%), radial-gradient(circle at 30% 30%, rgba(6,182,212,0.4) 0%, rgba(8,145,178,0.2) 20%, transparent 60%), #0f172a"
            : "radial-gradient(circle, rgba(56,189,248,0.08) 0%, rgba(20,184,166,0.15) 100%), radial-gradient(circle at 30% 30%, rgba(6,182,212,0.2) 0%, rgba(8,145,178,0.1) 20%, transparent 60%), #ffffff",
        }}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="relative w-24 h-24 mb-3 sm:mb-4">
              <div className="absolute inset-2 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-500 dark:text-cyan-400 animate-spin" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-cyan-700 dark:text-cyan-100">
              Analyzing document...
            </h3>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-6">
            <motion.div
              className="relative w-16 h-16 mb-4"
              animate={{ y: [0, -10, 0], rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            >
              <div className="absolute inset-0 rounded-full bg-cyan-200/50 dark:bg-cyan-500/10 backdrop-blur-sm"></div>
              <div className="absolute inset-2 flex items-center justify-center">
                <CloudUpload className="w-10 h-10 text-cyan-500 dark:text-cyan-300" />
              </div>
            </motion.div>
            <motion.h3
              className="text-base font-medium text-cyan-700 dark:text-cyan-100 mb-2 text-center"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            >
              Drag & drop files
            </motion.h3>
            <Button
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white flex items-center gap-2"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Browse Files</span>
            </Button>
          </div>
        )}
      </div>

      {/* {errorMessage && (
        <p className="text-red-500 mt-2">{errorMessage}</p>
      )} */}

      <div className="mt-4 text-center text-cyan-700 dark:text-cyan-200 max-w-md">
        <p className="mb-1 text-xs">
          Smart AI assistance for managing and analyzing your documents 
        </p>
        <p className="text-xs opacity-75">
          Auto-tagging • Context-aware search • Document insights
        </p>
      </div>
    </div>
  );
}