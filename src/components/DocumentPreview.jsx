import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";

export default function DocumentPreview({
  file,
  previewUrl,
  activeTab,
  documentAnalysis,
  isLoadingTranslation,
}) {
  if (!file || !previewUrl) {
    return (
      <div className="p-4 text-center text-gray-700 dark:text-slate-300">
        No file selected for preview. Please upload a file.
      </div>
    );
  }

  const mimeType = file.type;

  if (activeTab === "preview") {
    if (mimeType.startsWith("image/")) {
      return <ImagePreview previewUrl={previewUrl} />;
    }

    if (mimeType === "application/pdf") {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full min-h-[500px]"
          title="PDF Preview"
          onError={() => console.error("Failed to load PDF")}
        />
      );
    }

    return (
      <div className="p-4 text-center">
        <p className="text-gray-700 dark:text-slate-300 mb-2">
          Preview not supported for this file type ({mimeType}). Supported types: Images (JPEG, PNG), PDF.
        </p>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-600 dark:text-cyan-400 hover:underline"
        >
          Download File
        </a>
      </div>
    );
  }

  if (activeTab === "translation") {
    return (
      <div className="p-4 h-full overflow-auto bg-white dark:bg-slate-800">
        {isLoadingTranslation ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 text-cyan-500 dark:text-cyan-400 animate-spin" />
            <span className="ml-2">Translating document...</span>
          </div>
        ) : documentAnalysis?.translatedResponse ? (
          <pre className="whitespace-pre-wrap font-sans">
            {documentAnalysis.translatedResponse}
          </pre>
        ) : (
          <div className="text-gray-500 dark:text-slate-400 italic text-center py-8">
            Translation will appear here when available
          </div>
        )}
      </div>
    );
  }

  return null;
}

const ImagePreview = ({ previewUrl }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);

  const handleZoom = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    setZoom(Math.min(Math.max(0.5, zoom + delta), 3));
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="w-full h-full overflow-hidden relative"
      onWheel={handleZoom}
    >
      {error ? (
        <div className="p-4 text-center text-red-500">
          Failed to load image: {error}
        </div>
      ) : (
        <>
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <Button variant="outline" onClick={resetZoom}>
              Reset Zoom
            </Button>
            <div className="bg-white/80 px-3 py-1 rounded-md text-xs">
              Zoom: {Math.round(zoom * 100)}%
            </div>
          </div>
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-contain"
            style={{ transform: `scale(${zoom})` }}
            onError={() => setError("Unable to load image")}
          />
        </>
      )}
    </div>
  );
};