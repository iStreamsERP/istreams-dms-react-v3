import { useEffect, useState } from "react";
import AccessDenied from "@/components/AccessDenied";
import { BarLoader } from "react-spinners";
import { usePermissions } from "@/hooks/usePermissions";
import TreeView from "@/components/TreeView";
import { useToast } from "@/hooks/useToast";

export const DocumentTreePage = () => {
  const { toast } = useToast();
  const [userRights, setUserRights] = useState("");
  const [rightsChecked, setRightsChecked] = useState(false);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    fetchUserRights();
  }, []);

  const fetchUserRights = async () => {
    try {
      const result = await hasPermission("VIEW_ALL_DOCS");
      setUserRights(result ? "Allowed" : "Denied");
    } catch (error) {
      console.error("Permission check failed:", error);
      toast({
        variant: "destructive",
        title: "Permission Error",
        description: (error as Error).message || "Failed to check document permissions.",
      });
    } finally {
      setRightsChecked(true);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {!rightsChecked ? (
        <div className="flex justify-center items-start">
          <BarLoader color="#36d399" height={2} width="100%" />
        </div>
      ) : userRights !== "Allowed" ? (
        <AccessDenied />
      ) : (
        <>
          <TreeView />
        </>
      )}
    </div>
  );
};
