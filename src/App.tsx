// src/App.tsx
import router from "@/routes/AppRouter";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { RouterProvider, type RouteObject } from "react-router-dom";

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router as RouteObject[]} />
    </ThemeProvider>
  );
};

export default App;
