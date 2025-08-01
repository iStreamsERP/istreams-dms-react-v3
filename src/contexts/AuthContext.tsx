// src/contexts/AuthContext.tsx
import { callSoapService } from "@/api/callSoapService";
import { PERMISSION_KEYS, PERMISSION_MAP } from "@/permissions";
import type { AuthContextType, UserData } from "@/types/auth";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext<AuthContextType | null>(null);
const PUBLIC_SERVICE_URL = import.meta.env.VITE_SOAP_ENDPOINT;

const defaultUserData: UserData = {
  serviceUrl: PUBLIC_SERVICE_URL,
  clientURL: "",
  userEmail: "",
  userName: "",
  userEmployeeNo: "",
  userAvatar: "",
  companyName: "",
  companyAddress: "",
  companyLogo: "",
  companyCurrName: "",
  companyCurrDecimals: 0,
  companyCurrSymbol: null,
  companyCurrIsIndianStandard: false,
  isAdmin: false,
  permissions: {},
  docCategories: [],
  companyCode: "",
  branchCode: "",
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userData, setUserData] = useState<UserData>(() => {
    const storedData = JSON.parse(
      sessionStorage.getItem("userData") ||
        localStorage.getItem("userData") ||
        "null"
    );
    return storedData || defaultUserData;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [permissionLoading, setPermissionLoading] = useState<boolean>(false);

  const fetchAllPermissions = useCallback(
    async (user: UserData): Promise<Partial<UserData>> => {
      try {
        const { userName, clientURL } = user;

        const adminResponse = await callSoapService(
          clientURL,
          "DMS_Is_Admin_User",
          { UserName: userName }
        );
        const isAdmin: boolean = adminResponse === "Yes";

        const [categoriesResponse, ...permissionResponses] = await Promise.all([
          callSoapService(clientURL, "DMS_Get_Allowed_DocCategories", {
            UserName: userName,
          }),
          ...PERMISSION_KEYS.map((key: string): Promise<any> => {
            const { service, params } = PERMISSION_MAP[key];
            const payload = params(userName, isAdmin);
            return callSoapService(clientURL, service, payload);
          }),
        ]);

        const permissions = PERMISSION_KEYS.reduce(
          (acc: Record<string, string>, key: string, index: number) => {
            acc[key] = permissionResponses[index];
            return acc;
          },
          {}
        );

        return {
          isAdmin,
          permissions,
          docCategories: Array.isArray(categoriesResponse)
            ? categoriesResponse
            : [],
        };
      } catch (error) {
        console.error("Permission fetch error:", error);
        return {
          isAdmin: user.isAdmin,
          permissions: user.permissions,
          docCategories: user.docCategories || [],
        };
      }
    },
    []
  );

  const refreshPermissions = useCallback(async () => {
    if (!userData.userName) return;

    setPermissionLoading(true);
    try {
      const newPermissions = await fetchAllPermissions(userData);
      setUserData((prev) => ({
        ...prev,
        ...newPermissions,
      }));

      const storage = localStorage.getItem("userData")
        ? localStorage
        : sessionStorage;
      storage.setItem(
        "userData",
        JSON.stringify({
          ...userData,
          ...newPermissions,
        })
      );
    } catch (error) {
      console.error("Failed to refresh permissions:", error);
    } finally {
      setPermissionLoading(false);
    }
  }, [userData, fetchAllPermissions]);

  useEffect(() => {
    const initAuth = async () => {
      if (userData.userName) {
        try {
          const lastUpdated = localStorage.getItem("permissionsLastUpdated");
          const needsRefresh =
            !lastUpdated || Date.now() - parseInt(lastUpdated) > 300000;

          if (needsRefresh) {
            const newPermissions = await fetchAllPermissions(userData);
            setUserData((prev) => ({
              ...prev,
              ...newPermissions,
            }));

            localStorage.setItem(
              "permissionsLastUpdated",
              Date.now().toString()
            );
          }
        } catch (error) {
          console.error("Initial permission refresh failed:", error);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [userData, fetchAllPermissions]);

const login = useCallback(
  async (
    loginCredential: string | Partial<UserData>,
    password: string,
    rememberMe?: boolean
  ) => {
    setLoading(true);
    console.log(password);
    
    try {
      // Convert string loginCredential to Partial<UserData> if needed
      const data: Partial<UserData> =
        typeof loginCredential === "string"
          ? { userEmail: loginCredential } // Map string to userEmail
          : loginCredential;

      // Optionally, validate password here via a SOAP call if needed
      // Example: await callSoapService(data.serviceUrl, "verifyauthentication", { username: data.userEmail, password });

      // Fetch permissions during login
      const permissionsData = await fetchAllPermissions(data as UserData);

      const completeUserData: UserData = {
        ...defaultUserData,
        ...data,
        ...permissionsData,
      };

      // Store data
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("userData", JSON.stringify(completeUserData));
      if (rememberMe) {
        localStorage.setItem("permissionsLastUpdated", Date.now().toString());
      }

      setUserData(completeUserData);
    } catch (error) {
      console.error("Login permission error:", error);
      throw error; // Rethrow to handle in UI
    } finally {
      setLoading(false);
    }
  },
  [fetchAllPermissions]
);

  const logout = useCallback(() => {
    setUserData(defaultUserData);
    localStorage.removeItem("userData");
    sessionStorage.removeItem("userData");
    localStorage.removeItem("permissionsLastUpdated");
  }, []);

  const contextValue = useMemo(
    () => ({
      userData,
      loading: loading || permissionLoading,
      login,
      logout,
      refreshPermissions,
      isAuthenticated: !!userData.userEmail,
    }),
    [userData, loading, permissionLoading, login, logout, refreshPermissions]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
