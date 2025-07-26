import { DefaultLayout, UploadLayout } from "@/layouts";
import {
  CategoryAccessRightsPage,
  CategoryMasterPage,
  CategoryViewPage,
  DashboardPage,
  DocumentListPage,
  DocumentTreePage,
  DocumentViewPage,
  ForgetPasswordPage,
  LoginFormPage,
  NotFoundPage,
  RoleAccessRightsPage,
  SignUpPage,
  TaskPage,
  TeamsPage,
  TimeSheetPage,
  UploadDocumentPage,
  UserAccessRightsPage,
  UserListPage,
  UserPreferences,
  UserRolePage,
  TaskViewPage,
} from "@/pages";
import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const router: RouteObject[] = createBrowserRouter([
  {
    path: "/login",
    element: <LoginFormPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/forget-password",
    element: <ForgetPasswordPage />,
  },
  {
    path: "/upload-document",
    element: <ProtectedRoute />,
    children: [
      {
        element: <UploadLayout />,
        children: [{ index: true, element: <UploadDocumentPage /> }],
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <DefaultLayout />,
        children: [
          { index: true, element: <DashboardPage /> }, // Restored DashboardPage as index
          { path: "teams", element: <TeamsPage /> },
          { path: "category-view", element: <CategoryViewPage /> },
          { path: "document-tree-view", element: <DocumentTreePage /> },
          { path: "document-list", element: <DocumentListPage /> },
          { path: "document-view", element: <DocumentViewPage /> },
          { path: "task-view", element: <TaskViewPage /> },
          { path: "time-sheet", element: <TimeSheetPage /> },
          { path: "account-settings", element: <UserPreferences /> },
          { path: "task", element: <TaskPage /> },
          { path: "users", element: <UserListPage /> },
          { path: "user-role", element: <UserRolePage /> },
          {
            path: "category-access-rights",
            element: <CategoryAccessRightsPage />,
          }, // Fixed typo
          { path: "user-access-rights", element: <UserAccessRightsPage /> }, // Fixed typo
          { path: "role-access-rights", element: <RoleAccessRightsPage /> }, // Fixed typo
          { path: "category-master", element: <CategoryMasterPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
