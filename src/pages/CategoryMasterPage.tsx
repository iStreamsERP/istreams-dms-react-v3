import AccessDenied from "@/components/AccessDenied";
import { SearchInput } from "@/components/common/SearchInput";
import { CategoryModal } from "@/components/features/category/CategoryModal";
import { CategoryTable } from "@/components/features/category/CategoryTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCategoryData } from "@/hooks/useCategoryData";
import { usePermissions } from "@/hooks/usePermissions";
import type { AIQuestion, Category } from "@/types";
import { ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

export const CategoryMasterPage = () => {
  const { hasPermission } = usePermissions();
  const {
    categories,
    modules,
    loading,
    error,
    fetchCategoryDetails,
    saveCategoryAndQuestions,
    deleteCategoryAndQuestions,
  } = useCategoryData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<Category>({
    CATEGORY_NAME: "",
    DISPLAY_NAME: "",
    MODULE_NAME: "",
    SEARCH_TAGS: "",
  });
  const [aiQuestions, setAIQuestions] = useState<AIQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // Added for search functionality

  const canView = hasPermission("CATEGORY_MASTER_VIEW");

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    const lowerSearch = searchTerm?.toLowerCase();
    return categories.filter(
      (category) =>
        category.CATEGORY_NAME?.toLowerCase().includes(lowerSearch) ||
        category.DISPLAY_NAME?.toLowerCase().includes(lowerSearch) ||
        category.MODULE_NAME?.toLowerCase().includes(lowerSearch) ||
        category.SEARCH_TAGS?.toLowerCase().includes(lowerSearch)
    );
  }, [categories, searchTerm]);

  const handleCreate = () => {
    setMode("create");
    setSelectedCategory({
      CATEGORY_NAME: "",
      DISPLAY_NAME: "",
      MODULE_NAME: "",
      SEARCH_TAGS: "",
    });
    setAIQuestions([
      {
        REF_SERIAL_NO: -1,
        CATEGORY_NAME: "",
        QUESTION_FOR_AI: "",
        REF_KEY: "",
        IS_MANDATORY: "T",
        QUERY_FOR_VALIDATION: "",
      },
    ]);
    setIsDialogOpen(true);
  };

  const handleEdit = async (category: Category) => {
    try {
      const { category: fetchedCategory, aiQuestions } =
        await fetchCategoryDetails(category.CATEGORY_NAME);
      setMode("edit");
      setSelectedCategory(fetchedCategory);
      setAIQuestions(
        aiQuestions.length
          ? aiQuestions
          : [
              {
                REF_SERIAL_NO: -1,
                CATEGORY_NAME: fetchedCategory.CATEGORY_NAME,
                QUESTION_FOR_AI: "",
                REF_KEY: "",
                IS_MANDATORY: "T",
                QUERY_FOR_VALIDATION: "",
              },
            ]
      );
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Failed to fetch category details:", err);
      alert("Failed to load category details. Please try again.");
    }
  };

  const handleDelete = async (category: Category) => {
    if (
      window.confirm(
        "Are you sure you want to delete? This action cannot be undone."
      )
    ) {
      try {
        await deleteCategoryAndQuestions(category.CATEGORY_NAME);
      } catch (err) {
        console.error("Failed to delete category:", err);
        alert("Failed to delete category. Please try again.");
      }
    }
  };

  const handleSave = (category: Category, aiQuestions: AIQuestion[]) => {
    saveCategoryAndQuestions(category, aiQuestions);
    setIsDialogOpen(false);
  };

  // Fixed permission check: Show AccessDenied if user lacks permission
  if (!canView) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 items-center">
        <SearchInput value={searchTerm} onChange={setSearchTerm} />

        <div className="flex items-center justify-end gap-x-2">
          <Button onClick={handleCreate}>
            Create <ChevronRight />
          </Button>
        </div>
      </div>
      <CategoryTable
        categories={filteredCategories}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl w-full h-[95vh] max-h-[100vh]">
          <CategoryModal
            mode={mode}
            initialCategory={selectedCategory}
            initialAIQuestions={aiQuestions}
            modules={modules}
            onSave={handleSave}
            isSaving={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
