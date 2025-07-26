import { Lock } from "lucide-react";
import { Button } from "./ui/button";

const AccessDenied = () => {
  return (
    <div className="flex items-center justify-center h-[75vh] px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center border">
        <div className="bg-red-100 p-4 rounded-full w-fit mx-auto mb-6">
          <Lock size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-600 text-sm mb-6">
          You don’t have permission to access this feature. Please contact the admin if you need access.
        </p>
        <Button variant="destructive">
          Request Access
        </Button>
      </div>
    </div>
  );
};

export default AccessDenied;