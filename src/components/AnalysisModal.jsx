// components/AnalysisModal.jsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ClipboardCheck } from "lucide-react";
import { useState } from "react";

export default function AnalysisModal({
  isOpen,
  setIsOpen,
  generateAnalysisSummary,
  isGeneratingSummary,
}) {
  const [analysisQuestion, setAnalysisQuestion] = useState("");

  const handleGenerateSummary = async () => {
    // Split by new lines to handle multiple questions
    const questions = analysisQuestion
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q !== "");

    await generateAnalysisSummary(questions);
    setAnalysisQuestion("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="text-cyan-500" />
            Generate Analysis Summary
          </DialogTitle>
          <DialogDescription>
            Enter your questions (one per line) to generate the analysis summary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={analysisQuestion}
            onChange={(e) => setAnalysisQuestion(e.target.value)}
            placeholder="Enter your questions, one per line"
            className="min-h-[150px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary || !analysisQuestion.trim()}
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
