import { callSoapService } from '@/api/callSoapService';
import type { AIQuestion, Category, Module } from "@/types";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";

export const fetchCategories = async (
  clientURL: string
): Promise<Category[]> => {
  const payload = {
    DataModelName: "SYNM_DMS_DOC_CATEGORIES",
    WhereCondition: "",
    Orderby: "",
  };
  return callSoapService(clientURL, "DataModel_GetData", payload);
};

export const fetchCategoryByName = async (
  clientURL: string,
  categoryName: string
): Promise<Category[]> => {
  const payload = {
    DataModelName: "SYNM_DMS_DOC_CATEGORIES",
    WhereCondition: `CATEGORY_NAME = '${categoryName}'`,
    Orderby: "",
  };
  return callSoapService(clientURL, "DataModel_GetData", payload);
};

export const fetchAIQuestions = async (
  clientURL: string,
  categoryName: string
): Promise<AIQuestion[]> => {
  const payload = {
    DataModelName: "SYNM_DMS_DOC_CATG_QA",
    WhereCondition: `CATEGORY_NAME = '${categoryName}'`,
    Orderby: "",
  };
  return callSoapService(clientURL, "DataModel_GetData", payload);
};

export const fetchModules = async (clientURL: string): Promise<Module[]> => {
  const payload = {
    SQLQuery: `SELECT * FROM PROJECT_MODULES_LIST`,
  };
  return callSoapService(clientURL, "DataModel_GetDataFrom_Query", payload);
};

export const saveCategory = async (
  clientURL: string,
  userEmail: string,
  category: Category
): Promise<void> => {
  const convertedData = convertDataModelToStringData(
    "SYNM_DMS_DOC_CATEGORIES",
    category
  );
  const payload = {
    UserName: userEmail,
    DModelData: convertedData,
  };
  return callSoapService(clientURL, "DataModel_SaveData", payload);
};

export const saveAIQuestion = async (
  clientURL: string,
  userEmail: string,
  aiQuestion: AIQuestion
): Promise<void> => {
  const convertedData = convertDataModelToStringData(
    "SYNM_DMS_DOC_CATG_QA",
    aiQuestion
  );
  const payload = {
    UserName: userEmail,
    DModelData: convertedData,
  };
  return callSoapService(clientURL, "DataModel_SaveData", payload);
};

export const deleteCategory = async (
  clientURL: string,
  userEmail: string,
  categoryName: string
): Promise<void> => {
  const payload = {
    UserName: userEmail,
    DataModelName: "SYNM_DMS_DOC_CATEGORIES",
    WhereCondition: `CATEGORY_NAME = '${categoryName}'`,
  };
  return callSoapService(clientURL, "DataModel_DeleteData", payload);
};

export const deleteAIQuestions = async (
  clientURL: string,
  userEmail: string,
  categoryName: string
): Promise<void> => {
  const payload = {
    UserName: userEmail,
    DataModelName: "SYNM_DMS_DOC_CATG_QA",
    WhereCondition: `CATEGORY_NAME = '${categoryName}'`,
  };
  return callSoapService(clientURL, "DataModel_DeleteData", payload);
};
