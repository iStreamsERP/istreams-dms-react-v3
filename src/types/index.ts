export interface Category {
  CATEGORY_NAME: string;
  DISPLAY_NAME: string;
  MODULE_NAME: string;
  SEARCH_TAGS: string;
}

export interface AIQuestion {
  REF_SERIAL_NO: number;
  CATEGORY_NAME: string;
  QUESTION_FOR_AI: string;
  REF_KEY: string;
  IS_MANDATORY: 'T' | 'F';
  QUERY_FOR_VALIDATION: string;
}

export interface Module {
  MODULE_NAME: string;
}

export interface UserData {
  clientURL: string;
  userEmail: string;
}