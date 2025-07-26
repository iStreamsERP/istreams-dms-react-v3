import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeProvider";
import {
  CloudMoon,
  CloudSun,
  LogOut,
  Maximize,
  Minimize,
  Settings2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const UploadHeader = ({ handleReset }) => {
  const { userData, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="relative z-10 flex items-center justify-between px-3 py-1 bg-white dark:bg-slate-900">
      {/* Left: Logo and Collapse */}
      <Link to="/" className="flex items-center gap-x-3">
        <div>
          <img
            src="/logo-light.png"
            alt="iStreams ERP Solutions | CRM"
            className="dark:hidden h-8"
          />
          <img
            src="/logo-dark.png"
            alt="iStreams ERP Solutions | CRM"
            className="hidden dark:block h-8"
          />
        </div>
      </Link>

      {/* Right: Controls */}
      <nav className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={handleReset}
          className="ml-2 text-cyan-600 dark:text-cyan-400 p-2"
        >
          <Upload className="w-1 h-1 sm:w-2 sm:h-2" />
          <span>New Upload</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 p-0"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <CloudSun className="h-5 w-5" />
          ) : (
            <CloudMoon className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 p-0 hidden md:flex"
          onClick={toggleFullScreen}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userData.userAvatar} alt={userData.userName} />
              <AvatarFallback>{userData.userName.charAt(0)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64 mt-2">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{userData.userName}</p>
                <p className="text-xs text-muted-foreground">
                  {userData.userEmail}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate("/account-settings")}>
                <div className="flex justify-between items-center w-full">
                  Account Settings <Settings2 size={16} />
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <div className="flex justify-between items-center w-full">
                  Log out <LogOut size={16} />
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="p-0">
                <Button className="w-full h-9 text-sm">Upgrade to Pro</Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
};
