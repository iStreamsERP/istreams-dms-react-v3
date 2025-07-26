// src/index.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { StrictMode } from "react";
import { Provider } from "react-redux";
import TourController from "@/components/common/TourController";
import store from "@/app/store";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <Provider store={store}>
          <App />
          <TourController />
        </Provider>
      </AuthProvider>
    </StrictMode>
  );
}
