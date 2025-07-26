import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeProvider";
import {
  CloudMoon,
  CloudSun,
  LogOut,
  Maximize,
  Minimize,
  PanelLeftClose,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const DefaultHeader = ({ collapsed, setCollapsed }) => {
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
    <header className="relative z-10 flex items-center justify-between px-3 py-2 bg-slate-100 shadow-sm dark:bg-slate-900">
      {/* Left: Logo and Collapse */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 p-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          <PanelLeftClose
            className={`h-5 w-5 transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </Button>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/"
            className="text-sm font-semibold whitespace-nowrap hover:text-primary transition-colors"
          >
            iStreams ERP Solutions - DMS
          </Link>
          <Badge className="text-xs py-0.5 px-2">
            {userData.isAdmin ? "Admin Mode" : "User Mode"}
          </Badge>
        </div>
      </div>

      {/* Right: Controls */}
      <nav className="flex items-center gap-2">
        <div className="hidden lg:block border border-gray-300 dark:border-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
          {userData.companyName}
        </div>

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
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm font-medium">{userData.userName}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {userData.userEmail}
              </span>
            </div>
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
