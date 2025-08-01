// src/contexts/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { callSoapService } from "@/api/callSoapService";
import { PERMISSION_KEYS, PERMISSION_MAP } from "@/permissions";
import type { UserData } from "@/types/auth";
import type { AuthContextType } from "@/types/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase.config";

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
      rememberMe: boolean = false
    ) => {
      setLoading(true);
      try {
        // Normalize loginCredential
        const data: Partial<UserData> = typeof loginCredential === "string"
          ? { userEmail: loginCredential }
          : loginCredential;

        // Authenticate with Firebase for email
        if (typeof loginCredential === "string" && loginCredential.includes("@")) {
          await signInWithEmailAndPassword(auth, loginCredential, password);
        } else {
          // Handle phone login (assuming verified via OTP in SignUpPage.tsx)
          const authResponse = await callSoapService(
            PUBLIC_SERVICE_URL,
            "Public_User_Authenticate",
            {
              Credential: loginCredential,
              Password: password,
            }
          );
          if (authResponse !== "SUCCESS") {
            throw new Error("Authentication failed");
          }
        }

        // Fetch permissions
        const permissionsData = await fetchAllPermissions({
          ...defaultUserData,
          ...data,
        });

        const completeUserData: UserData = {
          ...defaultUserData,
          ...data,
          ...permissionsData,
        };

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("userData", JSON.stringify(completeUserData));
        if (rememberMe) {
          localStorage.setItem("permissionsLastUpdated", Date.now().toString());
        }

        setUserData(completeUserData);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error
          ? error.message
          : "Login failed";
        console.error("Login error:", errorMessage);
        throw new Error(errorMessage);
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