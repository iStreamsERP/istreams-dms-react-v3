import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setDocumentAnalysis, setLoading } from "@/app/actions";

const API_URL = import.meta.env.VITE_AI_API_BASE_URL;

export default function DocumentPreview({
  file,
  previewUrl,
  activeTab,
  documentAnalysis,
  isLoadingTranslation,
}) {
  const dispatch = useDispatch();
  const [translatedText, setTranslatedText] = useState(
    documentAnalysis?.translatedResponse || ""
  );
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    if (activeTab === "translation" && !translatedText && file) {
      handleTranslate("en"); // Default to English
    }
  }, [activeTab, file]);

  const handleTranslate = async (language) => {
    if (!file) return;

    dispatch(setLoading(true));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("Question", `Translate the document into ${language}`);

      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTranslatedText(response.data);
      dispatch(
        setDocumentAnalysis({
          ...documentAnalysis,
          translatedResponse: response.data,
        })
      );
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

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
          Preview not supported for this file type ({mimeType}). Supported types:
          Images (JPEG, PNG), PDF.
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
        <div className="flex gap-2 justify-end items-center mb-4">
          <label className="text-gray-700 dark:text-slate-300">
            Translate to:{" "}
          </label>
          <Select
            value={selectedLanguage}
            onValueChange={(value) => {
              setSelectedLanguage(value);
              handleTranslate(value);
            }}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="English" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ta">Tamil</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="ml">Malayalam</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {isLoadingTranslation ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 text-cyan-500 dark:text-cyan-400 animate-spin" />
            <span className="ml-2">Translating document...</span>
          </div>
        ) : translatedText ? (
          <pre className="whitespace-pre-wrap font-sans">{translatedText}</pre>
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
    <div className="w-full h-full overflow-hidden relative" onWheel={handleZoom}>
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