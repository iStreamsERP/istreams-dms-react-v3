import { useState, useCallback, useEffect } from "react";
import { callSoapService } from "@/api/callSoapService";

// Define interfaces for type safety
interface DocumentRights {
  REF_SEQ_NO: string;
  PERMISSION_USER_NAME: string;
  PERMISSION_VALID_TILL: string;
  PERMISSION_RIGHTS: string; // e.g., "R,D,W"
}

interface RightsCheckResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  checkPermission: () => Promise<void>;
}

interface UseDocumentRightsProps {
  clientURL: string;
  refSeqNo: string;
  userId: string;
  permission: "R" | "D" | "W";
}

export const useDocumentRights = ({
  clientURL,
  refSeqNo,
  userId,
  permission,
}: UseDocumentRightsProps): RightsCheckResult => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(async () => {
    if (!clientURL || !refSeqNo || !userId || !permission) {
      setError("Missing required parameters");
      setHasPermission(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        DataModelName: "SYNM_DMS_DOC_USER_RIGHTS",
        WhereCondition: `REF_SEQ_NO = ${refSeqNo} AND PERMISSION_USER_NAME = '${userId}'`,
        Orderby: "",
      };

      const response = await callSoapService(
        clientURL,
        "DataModel_GetData",
        payload
      );

      const userRights = response.find(
        (right: DocumentRights) =>
          right.REF_SEQ_NO === refSeqNo && right.PERMISSION_USER_NAME === userId
      );

      if (!userRights) {
        setError("No permissions found for this document");
        setHasPermission(false);
        return;
      }

      // Check expiration date only if PERMISSION_VALID_TILL is not null
      if (userRights.PERMISSION_VALID_TILL) {
        const timestampMatch =
          userRights.PERMISSION_VALID_TILL.match(/\/Date\((\d+)\)\//);
        if (!timestampMatch) {
          setError("Invalid permission date format");
          setHasPermission(false);
          return;
        }
        const validTill = new Date(parseInt(timestampMatch[1], 10));
        const isValid = validTill > new Date();
        if (!isValid) {
          setError("Permission has expired");
          setHasPermission(false);
          return;
        }
      }

      // Validate permission type
      const validPermissions = ["R", "D", "W"];
      if (!validPermissions.includes(permission)) {
        setError("Invalid permission type");
        setHasPermission(false);
        return;
      }

      // Check if user has the requested permission
      const rightsArray = userRights.PERMISSION_RIGHTS.split(",").map(
        (r: string) => r.trim()
      );

      const hasRequestedPermission =
        rightsArray.includes(permission) ||
        (permission === "R" && rightsArray.includes("W")) || // Write includes Read
        (permission === "D" && rightsArray.includes("W")); // Write includes Delete

      setHasPermission(hasRequestedPermission);
    } catch (err) {
      setError("Failed to fetch document rights");
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, [clientURL, refSeqNo, userId, permission]);

  // Automatically check permissions when dependencies change
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    isLoading,
    error,
    checkPermission,
  };
};