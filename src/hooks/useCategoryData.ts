import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCategories,
  fetchCategoryByName,
  fetchAIQuestions,
  fetchModules,
  saveCategory,
  saveAIQuestion,
  deleteCategory,
  deleteAIQuestions,
} from "@/api/services/categoryService";
import type { Category, AIQuestion, Module } from "@/types";

interface CategoryData {
  categories: Category[];
  modules: Module[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchCategoryDetails: (categoryName: string) => Promise<{
    category: Category;
    aiQuestions: AIQuestion[];
  }>;
  saveCategoryAndQuestions: (
    category: Category,
    aiQuestions: AIQuestion[]
  ) => Promise<void>;
  deleteCategoryAndQuestions: (categoryName: string) => Promise<void>;
}

export const useCategoryData = (): CategoryData => {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoriesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories(userData.clientURL);
      setCategories(data);
    } catch (err) {
      setError(err);
      toast({ variant: "destructive", title: err });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryDetails = async (categoryName: string) => {
    setLoading(true);
    try {
      const [categoryData, aiQuestions] = await Promise.all([
        fetchCategoryByName(userData.clientURL, categoryName),
        fetchAIQuestions(userData.clientURL, categoryName),
      ]);
      return {
        category: categoryData[0] || {},
        aiQuestions: aiQuestions || [],
      };
    } finally {
      setLoading(false);
    }
  };

  const fetchModulesData = async () => {
    try {
      const data = await fetchModules(userData.clientURL);
      setModules(data);
    } catch (err) {
      toast({ variant: "destructive", title: err });
    }
  };

  const saveCategoryAndQuestions = async (
    category: Category,
    aiQuestions: AIQuestion[]
  ) => {
    setLoading(true);
    try {
      await saveCategory(userData.clientURL, userData.userEmail, category);
      for (const aiQuestion of aiQuestions) {
        if (aiQuestion.QUESTION_FOR_AI || aiQuestion.REF_KEY) {
          await saveAIQuestion(userData.clientURL, userData.userEmail, {
            ...aiQuestion,
            CATEGORY_NAME: category.CATEGORY_NAME,
          });
        }
      }
      toast({ title: "Success", description: "Category saved successfully" });
      fetchCategoriesData();
    } catch (err) {
      toast({ variant: "destructive", title: err });
    } finally {
      setLoading(false);
    }
  };

  const deleteCategoryAndQuestions = async (categoryName: string) => {
    setLoading(true);
    try {
      await Promise.all([
        deleteCategory(userData.clientURL, userData.userEmail, categoryName),
        deleteAIQuestions(userData.clientURL, userData.userEmail, categoryName),
      ]);
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchCategoriesData();
    } catch (err) {
      toast({ variant: "destructive", title: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesData();
    fetchModulesData();
  }, []);

  return {
    categories,
    modules,
    loading,
    error,
    fetchCategories: fetchCategoriesData,
    fetchCategoryDetails,
    saveCategoryAndQuestions,
    deleteCategoryAndQuestions,
  };
};
