// src/hooks/usePermissions.tsx
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthContextType } from "@/types/auth";

interface Permissions {
  isAdmin: boolean;
  hasPermission: (permissionKey: string) => boolean;
  docCategories: string[];
  refreshPermissions: () => Promise<void>;
}

export const usePermissions = (): Permissions => {
  const { userData, refreshPermissions } = useAuth() as AuthContextType;

  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      return userData.permissions[permissionKey] === "Allowed";
    },
    [userData.permissions]
  );

  return {
    isAdmin: userData.isAdmin,
    hasPermission,
    docCategories: userData.docCategories,
    refreshPermissions,
  };
};
