import { UploadHeader } from "@/components";
import { useRef } from "react";
import { Outlet } from "react-router-dom";

export const UploadLayout = () => {
  const uploadRef = useRef();

  const handleReset = () => {
    // Call the child reset function
    uploadRef.current?.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Overlay Header */}
      <UploadHeader handleReset={handleReset} />

      {/* Main content gets full height, header overlays on top */}
      <main className="flex flex-col items-center justify-center relative">
        <Outlet context={{ uploadRef }} />
      </main>
    </div>
  );
};
