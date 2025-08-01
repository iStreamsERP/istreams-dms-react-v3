// src/App.tsx
import router from "@/routes/AppRouter";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeProvider";

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

export default App;
