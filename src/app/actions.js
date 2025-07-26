//app/actions.js
import axios from "axios";
import { callSoapService } from "@/api/callSoapService";
import { convertDataModelToStringData } from "@/utils/dataModelConverter";
import { stripMarkdownCodeBlock } from "../utils/stripMarkdownCodeBlock";

const API_URL = import.meta.env.VITE_AI_API_BASE_URL;

export const setDocumentAnalysis = (analysis) => ({
  type: "SET_DOCUMENT_ANALYSIS",
  payload: analysis,
});

export const addMessage = (message) => ({
  type: "ADD_MESSAGE",
  payload: message,
});

export const addLocalQuestion = (questionData) => ({
  type: "ADD_LOCAL_QUESTION",
  payload: questionData,
});

export const setAnalysisSummary = (summary) => {
  return {
    type: "SET_ANALYSIS_SUMMARY",
    payload: summary,
  };
};

export const appendAnalysisSummary = (summary) => ({
  type: "APPEND_ANALYSIS_SUMMARY",
  payload: summary,
});

export const setSelectedType = (type) => ({
  type: "SET_SELECTED_TYPE",
  payload: type,
});

export const setLoading = (isLoading) => ({
  type: "SET_LOADING",
  payload: isLoading,
});

export const setError = (error) => ({
  type: "SET_ERROR",
  payload: error,
});

export const setSuccessMessage = (message) => ({
  type: "SET_SUCCESS_MESSAGE",
  payload: message,
});

export const setFetchedDocument = (document) => ({
  type: "SET_FETCHED_DOCUMENT",
  payload: document,
});

export const clearLocalQuestions = () => ({
  type: "CLEAR_LOCAL_QUESTIONS",
});

export const uploadFile = (file) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const formData = new FormData();
    formData.append("File", file);
    formData.append(
      "Question",
      `Analyze the uploaded document and return the result in JSON format with the following structure:
      {
        "documentType": "[Choose standard document type]",
        "translatedResponse": "[Translate the document into english]"
      }
      Do not add any other text or explanation — only return the JSON object.`
    );

    const response = await axios.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const cleanJson = stripMarkdownCodeBlock(response.data);
    dispatch(setDocumentAnalysis(cleanJson));
    dispatch(setSelectedType(cleanJson.documentType || ""));
    dispatch({ type: "SET_FILE", payload: file });
  } catch (error) {
    dispatch(setError("Error uploading file"));
    console.error("Error uploading file:", error);
  } finally {
    dispatch(setLoading(false));
  }
};

export const askQuestion = (file, question) => async (dispatch) => {
  if (!file || !question.trim()) return;

  const userMessage = {
    id: Date.now(),
    text: question,
    sender: "user",
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  dispatch(addMessage(userMessage));
  dispatch(setLoading(true));

  try {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("Question", question);

    const res = await axios.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const aiMessage = {
      id: Date.now() + 1,
      text: res.data,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    dispatch(addMessage(aiMessage));
  } catch (error) {
    dispatch(
      addMessage({
        id: Date.now() + 1,
        text: "Sorry, I couldn’t process your request. Please try again.",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })
    );
    dispatch(setError("Error asking question"));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchQuestionsAndGenerateSummary =
  (category, file, clientURL) => async (dispatch) => {
    if (!category || !file) return;

    dispatch(setLoading(true));
    try {
      const qaResponse = await callSoapService(clientURL, "DataModel_GetData", {
        DataModelName: "SYNM_DMS_DOC_CATG_QA",
        WhereCondition: `CATEGORY_NAME = '${category}'`,
        Orderby: "",
      });

      if (!qaResponse || qaResponse.length === 0) {
        dispatch(
          setError(`No questions found for document type "${category}"`)
        );
        dispatch(setAnalysisSummary([]));
        return;
      }

      const questions = qaResponse
        .map((item) => item.QUESTION_FOR_AI?.trim().toLowerCase())
        .filter(Boolean);

      const questionsMap = {};
      qaResponse.forEach((item) => {
        const normalizedKey = item.QUESTION_FOR_AI?.trim().toLowerCase();
        if (item.REF_KEY && normalizedKey) {
          questionsMap[normalizedKey] = item.REF_KEY;
        }
      });

      const formData = new FormData();
      formData.append("File", file);
      formData.append("Question", `${questions.join(", ")}`);

      const res = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const answerLines = res.data
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => line.replace(/^- /, "").trim());

      const summary = answerLines.map((line, index) => {
        const question = questions[index];
        if (!questionsMap[question]) {
          console.warn("Missing REF_KEY for:", question);
          console.log("Available keys:", Object.keys(questionsMap));
        }
        const label = questionsMap[question] || question;
        return { text: line, label, question };
      });

      dispatch(setAnalysisSummary(summary));
    } catch (error) {
      dispatch(setError("Failed to fetch questions or generate summary"));
      console.error("Error generating summary:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const createDocument =
  (file, selectedType, analysisSummary, localQuestions, clientURL, userEmail) =>
  async (dispatch) => {
    if (!selectedType || analysisSummary.length === 0) {
      dispatch(
        setError(
          "Please select a document type and generate a summary before creating a document"
        )
      );
      return;
    }

    dispatch(setLoading(true));
    try {
      // Create SYNM_DMS_MASTER record
      const documentData = {
        REF_SEQ_NO: -1,
        DOC_RELATED_CATEGORY: selectedType,
        USER_NAME: userEmail,
        ENT_DATE: "",
      };

      const payload = {
        UserName: userEmail,
        DModelData: convertDataModelToStringData(
          "SYNM_DMS_MASTER",
          documentData
        ),
      };

      const masterResponse = await callSoapService(
        clientURL,
        "DataModel_SaveData",
        payload
      );

      const message = masterResponse;
      const refSeqNo = message.match(/'(\d+)'/)[1];

      // Save to SYNM_DMS_DOC_CATG_QA
      const allQuestions = [...analysisSummary, ...localQuestions];
      for (const item of allQuestions) {
        const questionData = {
          REF_SERIAL_NO: -1,
          CATEGORY_NAME: selectedType,
          QUESTION_FOR_AI: item.question,
          REF_KEY: item.refKey || item.label,
          IS_MANDATORY: item.isMandatory || "F",
        };

        const questionPayload = {
          UserName: userEmail,
          DModelData: convertDataModelToStringData(
            "SYNM_DMS_DOC_CATG_QA",
            questionData
          ),
        };

        await callSoapService(clientURL, "DataModel_SaveData", questionPayload);
      }

      let serialCounter = 1;
      // Save to SYNM_DMS_DOC_VALUES
      for (const item of allQuestions) {
        const answerData = {
          REF_SEQ_NO: refSeqNo,
          SERIAL_NO: serialCounter++,
          CATEGORY_NAME: selectedType,
          REF_KEY: item.refKey || item.label,
          REF_VALUE: item.text,
          ANSWER_FROM_AI: item.text,
        };

        const answerPayload = {
          UserName: userEmail,
          DModelData: convertDataModelToStringData(
            "SYNM_DMS_DOC_VALUES",
            answerData
          ),
        };

        await callSoapService(clientURL, "DataModel_SaveData", answerPayload);
      }
      // Fetch SYNM_DMS_MASTER with refSeqNo
      const fetchedDocument = await dispatch(
        fetchDocsMaster(refSeqNo, clientURL)
      );

      dispatch(clearLocalQuestions());
      dispatch(setAnalysisSummary([]));
      dispatch(setSuccessMessage("Document created successfully"));
      return { refSeqNo, fetchedDocument };
    } catch (error) {
      dispatch(setError("Failed to create document"));
      console.error("Error creating document:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const fetchDocsMaster = (refSeqNo, clientURL) => async (dispatch) => {
  try {
    const response = await callSoapService(clientURL, "DataModel_GetData", {
      DataModelName: "SYNM_DMS_MASTER",
      WhereCondition: `REF_SEQ_NO = ${refSeqNo}`,
      Orderby: "",
    });

    dispatch(setFetchedDocument(response[0] || null));
    return response[0] || null; // Return the fetched document
  } catch (error) {
    dispatch(setError("Failed to fetch docs master"));
    console.error("Error fetching docs master:", error);
    throw error;
  }
};

export const setFile = (file) => ({
  type: "SET_FILE",
  payload: file,
});