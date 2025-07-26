import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import type { AIQuestion, Category, Module } from "@/types";

interface CategoryModalProps {
  mode: "create" | "edit";
  initialCategory: Category;
  initialAIQuestions: AIQuestion[];
  modules: Module[];
  onSave: (category: Category, aiQuestions: AIQuestion[]) => void;
  isSaving: boolean;
}

export function CategoryModal({
  mode,
  initialCategory,
  initialAIQuestions,
  modules,
  onSave,
  isSaving,
}: CategoryModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Category>(initialCategory);
  const [aiFormDataList, setAiFormDataList] =
    useState<AIQuestion[]>(initialAIQuestions);
  const [nextTempId, setNextTempId] = useState(
    initialAIQuestions.length
      ? Math.min(...initialAIQuestions.map((q) => q.REF_SERIAL_NO)) - 1
      : -1
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const sanitizedValue =
      name === "SEARCH_TAGS" ? value : value.replace(/[^a-zA-Z0-9\s_]/g, "");
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAiInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const updatedList = [...aiFormDataList];
    updatedList[index] = { ...updatedList[index], [name]: value };
    setAiFormDataList(updatedList);
  };

  const handleAiMandatoryChange = (index: number) => {
    const updatedList = [...aiFormDataList];
    updatedList[index] = {
      ...updatedList[index],
      IS_MANDATORY: updatedList[index].IS_MANDATORY === "T" ? "F" : "T",
    };
    setAiFormDataList(updatedList);
  };

  const addAiQuestion = () => {
    setAiFormDataList([
      ...aiFormDataList,
      {
        REF_SERIAL_NO: nextTempId,
        CATEGORY_NAME: formData.CATEGORY_NAME,
        QUESTION_FOR_AI: "",
        REF_KEY: "",
        IS_MANDATORY: "T",
        QUERY_FOR_VALIDATION: "",
      },
    ]);
    setNextTempId((prev) => prev - 1);
  };

  const removeAiQuestion = (index: number) => {
    if (aiFormDataList.length <= 1) return;
    const updatedList = [...aiFormDataList];
    updatedList.splice(index, 1);
    setAiFormDataList(updatedList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.CATEGORY_NAME.trim()) {
      toast({
        title: "Validation Error",
        description: "Category Name is required",
        variant: "destructive",
      });
      return;
    }
    onSave(formData, aiFormDataList);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col max-h-[95vh] overflow-y-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2 col-span-1 p-1">
          <h1 className="text-lg font-medium">
            {mode === "edit" ? "Edit" : "Create"} Category
          </h1>
          <h6 className="text-sm text-muted-foreground mb-4">
            Configure category settings
          </h6>
          <div className="space-y-1">
            <Label htmlFor="CATEGORY_NAME">Category Name *</Label>
            <Input
              id="CATEGORY_NAME"
              name="CATEGORY_NAME"
              value={formData.CATEGORY_NAME}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="DISPLAY_NAME">Display Name *</Label>
            <Input
              id="DISPLAY_NAME"
              name="DISPLAY_NAME"
              value={formData.DISPLAY_NAME}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="MODULE_NAME">Module Name *</Label>
            <Select
              value={formData.MODULE_NAME}
              onValueChange={(value) =>
                handleSelectChange("MODULE_NAME", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Modules</SelectLabel>
                  {modules.map((module) => (
                    <SelectItem
                      key={module.MODULE_NAME}
                      value={module.MODULE_NAME}
                    >
                      {module.MODULE_NAME}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="SEARCH_TAGS">Search Tags</Label>
            <Textarea
              id="SEARCH_TAGS"
              name="SEARCH_TAGS"
              value={formData.SEARCH_TAGS}
              onChange={handleInputChange}
              placeholder="Enter comma-separated search tags"
            />
            <p className="text-xs text-muted-foreground">
              Use commas to separate tags (e.g., invoice, bill) to enhance AI
              analysis.
            </p>
          </div>
        </div>
        <div className="space-y-2 col-span-2">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium">User Input Prompts</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addAiQuestion}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Question
            </Button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {aiFormDataList.map((aiItem, index) => (
              <div key={aiItem.REF_SERIAL_NO} className="border rounded-lg p-2">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">Input #{index + 1}</h3>
                  {aiFormDataList.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeAiQuestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Label htmlFor={`refkey-${index}`}>Reference Key</Label>
                      <div className="flex items-center space-x-2 pt-1">
                        <Checkbox
                          id={`mandatory-${index}`}
                          checked={aiItem.IS_MANDATORY === "T"}
                          onCheckedChange={() => handleAiMandatoryChange(index)}
                        />
                        <Label htmlFor={`mandatory-${index}`} className="!m-1">
                          Mandatory
                        </Label>
                      </div>
                    </div>
                    <Input
                      id={`refkey-${index}`}
                      name="REF_KEY"
                      value={aiItem.REF_KEY}
                      onChange={(e) => handleAiInputChange(index, e)}
                      placeholder="e.g. Invoice Number"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`question-${index}`}>Question *</Label>
                    <Input
                      id={`question-${index}`}
                      name="QUESTION_FOR_AI"
                      value={aiItem.QUESTION_FOR_AI}
                      onChange={(e) => handleAiInputChange(index, e)}
                      placeholder="e.g. What is the invoice number?"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter className="mt-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "edit" ? "Update Category" : "Create Category"}
        </Button>
      </DialogFooter>
    </form>
  );
}
