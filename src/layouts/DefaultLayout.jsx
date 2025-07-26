import { cn } from "@/lib/utils";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useClickOutside } from "../hooks/useClickOutside";
import { Bot, CloudUpload } from "lucide-react";
import { DefaultHeader, Sidebar } from "@/components";

export const DefaultLayout = () => {
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const [collapsed, setCollapsed] = useState(!isDesktopDevice);

  const sidebarRef = useRef(null);

  useEffect(() => {
    setCollapsed(!isDesktopDevice);
  }, [isDesktopDevice]);

  useClickOutside([sidebarRef], () => {
    if (!isDesktopDevice && !collapsed) setCollapsed(true);
  });

  return (
    <div className="min-h-screen bg-slate-100 text-2xl transition-colors dark:bg-slate-950">
      <div
        className={cn(
          "pointer-events-none fixed inset-0 bg-black opacity-0 transition-opacity",
          !collapsed && "max-md:pointer-events-auto max-md:opacity-30"
        )}
      />
      <Sidebar ref={sidebarRef} collapsed={collapsed} />
      <div
        className={cn(
          "transition-[margin] duration-300",
          collapsed ? "md:ml-[50px]" : "md:ml-[180px]"
        )}
      >
        <DefaultHeader collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="h-[calc(100vh-52px)] overflow-y-auto overflow-x-hidden p-2">
          <Outlet />

          <div className="fixed bottom-8 right-8">
            <Link
              to="/upload-document"
              className="group flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 p-4 text-white shadow-lg transition-all duration-300 ease-in-out hover:from-indigo-600 hover:to-blue-700 hover:shadow-xl"
              aria-label="Upload Document"
            >
              <CloudUpload
                size={24}
                className="shrink-0 transform transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110"
              />

              {/* Expanding label */}
              <span className="ml-0 font-semibold max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 text-sm">
                Upload document
              </span>
            </Link>
          </div>
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
};
