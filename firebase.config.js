// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBl2sWbZFDvFp_7BIaxCjapm8j0q6BDjA0",
  authDomain: "istreamscrm-web-autentication.firebaseapp.com",
  projectId: "istreamscrm-web-autentication",
  storageBucket: "istreamscrm-web-autentication.firebasestorage.app",
  messagingSenderId: "1052284773733",
  appId: "1:1052284773733:web:1aa247bd6e996ed3b3ed8c",
  measurementId: "G-YDVWKGX3YH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

if (import.meta.env.VITE_USE_AUTH_EMULATOR === "true" && window.location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099", {
    disableWarnings: true,
  });
  console.log("🚀 Connected to Auth Emulator");
}

export default app;