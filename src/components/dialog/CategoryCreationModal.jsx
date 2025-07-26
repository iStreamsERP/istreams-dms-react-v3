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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { callSoapService } from "@/api/callSoapService";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "../ui/textarea";

export function CategoryCreationModal({ mode, selectedItem, onSuccess }) {
  const { userData } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const initialFormData = {
    CATEGORY_NAME: "",
    DISPLAY_NAME: "",
    MODULE_NAME: "",
    SEARCH_TAGS: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [aiFormDataList, setAiFormDataList] = useState([]);
  const [modules, setModules] = useState([]);
  const [nextTempId, setNextTempId] = useState(-1);

  // Initialize AI form data properly
  const getInitialAiFormData = () => ({
    REF_SERIAL_NO: nextTempId,
    CATEGORY_NAME: formData.CATEGORY_NAME,
    QUESTION_FOR_AI: "",
    REF_KEY: "",
    IS_MANDATORY: "T",
    QUERY_FOR_VALIDATION: "",
  });

  useEffect(() => {
    if (aiFormDataList.length === 0) {
      setAiFormDataList([getInitialAiFormData()]);
      setNextTempId((prev) => prev - 1);
    }
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === "SEARCH_TAGS") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      const sanitizedValue = value.replace(/[^a-zA-Z0-9\s_]/g, "");
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await fetchModules();
        if (mode === "edit") {
          await fetchCategory();
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [mode]);

  const fetchModules = async () => {
    const payload = {
      SQLQuery: `SELECT * FROM PROJECT_MODULES_LIST`,
    };

    const response = await callSoapService(
      userData.clientURL,
      "DataModel_GetDataFrom_Query",
      payload
    );

    setModules(response || []);
  };

  const fetchCategory = async () => {
    setIsLoading(true);
    try {
      const payload = {
        DataModelName: "SYNM_DMS_DOC_CATEGORIES",
        WhereCondition: `CATEGORY_NAME = '${selectedItem.CATEGORY_NAME}'`,
        Orderby: "",
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        payload
      );

      const data = response?.[0] || {};
      setFormData({
        ...data,
        CATEGORY_NAME:
          data.CATEGORY_NAME?.replace(/[^a-zA-Z0-9\s_]/g, "") || "",
        DISPLAY_NAME: data.DISPLAY_NAME?.replace(/[^a-zA-Z0-9\s_]/g, "") || "",
      });

      // Fetch AI questions
      const aiPayload = {
        DataModelName: "SYNM_DMS_DOC_CATG_QA",
        WhereCondition: `CATEGORY_NAME = '${selectedItem.CATEGORY_NAME}'`,
        Orderby: "",
      };

      const aiResponse = await callSoapService(
        userData.clientURL,
        "DataModel_GetData",
        aiPayload
      );

      setAiFormDataList(
        aiResponse?.length > 0
          ? aiResponse.map((item) => ({
              ...item,
              IS_MANDATORY: item.IS_MANDATORY || "T",
            }))
          : [getInitialAiFormData()]
      );

      // Find the minimum temp ID from existing questions
      if (aiResponse?.length > 0) {
        const minId = Math.min(...aiResponse.map((item) => item.REF_SERIAL_NO));
        setNextTempId(minId > 0 ? -1 : minId - 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedList = [...aiFormDataList];
    updatedList[index] = { ...updatedList[index], [name]: value };
    setAiFormDataList(updatedList);
  };

  const handleAiMandatoryChange = (index) => {
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
      { ...getInitialAiFormData(), REF_SERIAL_NO: nextTempId },
    ]);
    setNextTempId((prev) => prev - 1);
  };

  const removeAiQuestion = (index) => {
    if (aiFormDataList.length <= 1) return;
    const updatedList = [...aiFormDataList];
    updatedList.splice(index, 1);
    setAiFormDataList(updatedList);
  };

  const saveAiQuestions = async () => {
    for (const aiItem of aiFormDataList) {
      // Skip if both fields are empty
      if (!aiItem.QUESTION_FOR_AI && !aiItem.REF_KEY) continue;

      const aiData = {
        ...aiItem,
        CATEGORY_NAME: formData.CATEGORY_NAME,
      };

      const convertedAiData = convertDataModelToStringData(
        "SYNM_DMS_DOC_CATG_QA",
        aiData
      );

      console.log(convertedAiData);

      const payload = {
        UserName: userData.userEmail,
        DModelData: convertedAiData,
      };

      const response = await callSoapService(
        userData.clientURL,
        "DataModel_SaveData",
        payload
      );

      console.log(response);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate category name
    if (!formData.CATEGORY_NAME.trim()) {
      toast({
        title: "Validation Error",
        description: "Category Name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save main category
      const convertedDataModel = convertDataModelToStringData(
        "SYNM_DMS_DOC_CATEGORIES",
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

      console.log(response);

      // Save AI questions
      await saveAiQuestions();

      toast({
        title: "Success",
        description: "Category and AI questions saved successfully",
      });
      onSuccess();
      setFormData(initialFormData);
      setAiFormDataList([getInitialAiFormData()]);
      setNextTempId(-1);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:justify-between max-h-[95vh] md:max-h-full overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Category Form */}
            <div className="space-y-2 col-span-1 p-1">
              <div>
                <h1 className="text-lg font-medium">
                  {mode === "edit" ? "Edit" : "Create"} Category
                  {isLoading && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin inline-block" />
                  )}
                </h1>
                <h6 className="text-sm text-muted-foreground mb-4">
                  Configure category settings
                </h6>
              </div>

              <div className="space-y-1">
                <Label htmlFor="CATEGORY_NAME">Category Name *</Label>
                <Input
                  id="CATEGORY_NAME"
                  name="CATEGORY_NAME"
                  value={formData.CATEGORY_NAME}
                  onChange={handleInputChange}
                  required
                  className="w-full"
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
                  className="w-full"
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
                  <SelectContent className="z-[9999]">
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
                  className="w-full min-h-[30px]"
                />
                <p className="text-xs text-muted-foreground">
                  Use commas to separate tags (e.g., invoice, bill) to
                  enhance AI analysis.
                </p>
              </div>
            </div>

            {/* Right Column - AI Questions (Scrollable) */}
            <div className="space-y-2 col-span-2">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium">User input Prompts</h2>
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

              <div className="space-y-2 h-full md:max-h-[400px] overflow-y-auto pr-2">
                {aiFormDataList.map((aiItem, index) => (
                  <div
                    key={aiItem.REF_SERIAL_NO}
                    className="border rounded-lg p-2"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Input #{index + 1}</h3>
                      </div>
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
                          <Label htmlFor={`refkey-${index}`}>
                            Reference Key
                          </Label>
                          <div className="flex items-center space-x-2 pt-1">
                            <Checkbox
                              id={`mandatory-${index}`}
                              checked={aiItem.IS_MANDATORY === "T"}
                              onCheckedChange={() =>
                                handleAiMandatoryChange(index)
                              }
                            />
                            <Label
                              htmlFor={`mandatory-${index}`}
                              className="!m-1"
                            >
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
                          className="w-full"
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
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {mode === "edit" ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}
