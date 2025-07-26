import axios from "axios";

const BASE_URL = "https://apps.istreams-erp.com:4490/api";

export const sendEmail = async (emailData) => {
  try {
    const response = await axios.post(`${BASE_URL}/Email/send`, emailData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Email sending failed:", error.response?.data || error.message);
    throw error; // So the caller can handle it
  }
};