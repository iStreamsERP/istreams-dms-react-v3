//app/store.js
import { createStore, applyMiddleware } from "redux";
import { thunk } from "redux-thunk";

const initialState = {
  documentAnalysis: null,
  messages: [],
  analysisSummary: [],
  localQuestions: [],
  selectedType: "",
  isLoading: false,
  error: "",
  file: null,
  successMessage: "",
  fetchedDocument: null,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_DOCUMENT_ANALYSIS":
      return { ...state, documentAnalysis: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "ADD_LOCAL_QUESTION":
      return {
        ...state,
        localQuestions: [...state.localQuestions, action.payload],
      };
    case "SET_ANALYSIS_SUMMARY":
      return { ...state, analysisSummary: action.payload };
    case "APPEND_ANALYSIS_SUMMARY":
      // Ensure no duplicates by filtering out existing questions
      const existingQuestions = new Set(
        state.analysisSummary.map((item) => item.question)
      );
      const newItems = Array.isArray(action.payload)
        ? action.payload.filter((item) => !existingQuestions.has(item.question))
        : !existingQuestions.has(action.payload.question)
        ? [action.payload]
        : [];
      return {
        ...state,
        analysisSummary: [...state.analysisSummary, ...newItems],
      };
    case "SET_SELECTED_TYPE":
      return { ...state, selectedType: action.payload };
    case "SET_FILE":
      return { ...state, file: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_LOCAL_QUESTIONS":
      return { ...state, localQuestions: [] };
    case "SET_SUCCESS_MESSAGE":
      return { ...state, successMessage: action.payload };
    case "SET_FETCHED_DOCUMENT":
      return { ...state, fetchedDocument: action.payload };
    default:
      return state;
  }
};

const store = createStore(reducer, applyMiddleware(thunk));
export default store;