import {
  ClipboardCheck,
  Languages,
  MessageSquare,
  ScanSearch,
} from "lucide-react";
import { useEffect, useState } from "react";
import AnalysisSummary from "./AnalysisSummary";
import ChatInterface from "./ChatInterface";
import DocumentPreview from "./DocumentPreview";
import FloatingChatButton from "./FloatingChatButton";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";
import { callSoapService } from "@/api/callSoapService";
import { useAuth } from "@/contexts/AuthContext";

export default function AnalysisView({
  file,
  previewUrl,
  documentAnalysis,
  isLoadingTranslation = false, // Default to false if not provided
  messages,
  isResponseLoading,
  askQuestion,
  setIsChatOpen,
}) {
  const { userData } = useAuth();
  const [activeLeftTab, setActiveLeftTab] = useState("preview");
  const [activeRightTab, setActiveRightTab] = useState("summary");
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmationFailed, setConfirmationFailed] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (documentAnalysis?.documentType) {
      setSelectedType(documentAnalysis.documentType);
    } else {
      setShowDropdown(true);
    }
  }, [documentAnalysis]);

  const saveToDB = async (data) => {
    if (!selectedType) {
      alert("Please select a document type before saving.");
      return;
    }

    try {
      const questionData = {
        REF_SERIAL_NO: -1,
        CATEGORY_NAME: selectedType,
        QUESTION_FOR_AI: data.QUESTION_FOR_AI || "No question available",
        REF_KEY: data.REF_KEY,
        IS_MANDATORY: data.IS_MANDATORY || "F",
      };

      const answerData = {
        SERIAL_NO: -1,
        CATEGORY_NAME: selectedType,
        REF_KEY: data.REF_KEY,
        REF_VALUE: data.REF_VALUE || "No answer available",
        AI_ANSWER: data.AI_ANSWER || "No answer available",
      };

      const questionPayload = {
        UserName: userData.userEmail,
        DModelData: convertDataModelToStringData(
          "SYNM_DMS_DOC_CATG_QA",
          questionData
        ),
      };

      await callSoapService(
        userData.clientURL,
        "DataModel_SaveData",
        questionPayload
      ).then((response) => {
        console.log("Question saved to SYNM_DMS_DOC_CATG_QA:", response);
      });

      const answerPayload = {
        UserName: userData.userEmail,
        DModelData: convertDataModelToStringData(
          "SYNM_DMS_DOC_VALUES",
          answerData
        ),
      };

      await callSoapService(
        userData.clientURL,
        "DataModel_SaveData",
        answerPayload
      ).then((response) => {
        console.log("Answer saved to SYNM_DMS_DOC_VALUES:", response);
      });
    } catch (error) {
      console.error("Error in saveToDB:", error);
      alert("Failed to save to database. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full h-full flex flex-col border-r border-gray-200 dark:border-slate-700">
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-800">
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              <TabButton
                icon="ScanSearch"
                label="Preview"
                active={activeLeftTab === "preview"}
                onClick={() => setActiveLeftTab("preview")}
              />
              <TabButton
                icon="Languages"
                label="Translated to English"
                active={activeLeftTab === "translation"}
                onClick={() => setActiveLeftTab("translation")}
              />
            </div>
          </div>

          <DocumentPreview
            file={file}
            previewUrl={previewUrl}
            activeTab={activeLeftTab}
            documentAnalysis={documentAnalysis}
            isLoadingTranslation={isLoadingTranslation}
          />
        </div>

        <div className="hidden w-full h-full md:flex flex-col">
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-800">
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              <TabButton
                icon="ClipboardCheck"
                label="Analysis Summary"
                active={activeRightTab === "summary"}
                onClick={() => setActiveRightTab("summary")}
              />
              <TabButton
                icon="MessageSquare"
                label="Chat"
                active={activeRightTab === "chat"}
                onClick={() => setActiveRightTab("chat")}
              />
            </div>
          </div>

          {activeRightTab === "summary" ? (
            <AnalysisSummary
              file={file}
              documentAnalysis={documentAnalysis}
              analysisSummary={analysisSummary}
              setAnalysisSummary={setAnalysisSummary}
              isAnalysisModalOpen={isAnalysisModalOpen}
              setIsAnalysisModalOpen={setIsAnalysisModalOpen}
              isGeneratingSummary={isGeneratingSummary}
              setIsGeneratingSummary={setIsGeneratingSummary}
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              confirmationFailed={confirmationFailed}
              setConfirmationFailed={setConfirmationFailed}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              activeRightTab={activeRightTab}
            />
          ) : (
            <ChatInterface
              messages={messages}
              isResponseLoading={isResponseLoading}
              askQuestion={askQuestion}
              saveToDB={saveToDB}
            />
          )}
        </div>
      </div>

      <FloatingChatButton
        activeRightTab={activeRightTab}
        setActiveRightTab={setActiveRightTab}
        setIsChatOpen={setIsChatOpen}
      />
    </div>
  );
}

const TabButton = ({ icon, label, active, onClick }) => {
  const IconComponent = getIconComponent(icon);
  return (
    <button
      className={`flex-1 px-4 py-2 font-medium flex items-center justify-center gap-2 text-sm ${
        active
          ? "text-cyan-700 dark:text-cyan-300 border-b-2 border-cyan-500 dark:border-cyan-400"
          : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-300"
      }`}
      onClick={onClick}
    >
      <IconComponent className="w-4 h-4" />
      {label}
    </button>
  );
};

const getIconComponent = (iconName) => {
  const icons = {
    ScanSearch,
    Languages,
    ClipboardCheck,
    MessageSquare,
  };
  return icons[iconName];
};