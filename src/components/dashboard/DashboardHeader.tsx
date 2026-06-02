import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import userAvatar from "@/assets/user-avatar.png";
import {
  Bell,
  Sparkles,
  Moon,
  Sun,
  UserCircle,
  Building2,
  Settings,
  CreditCard,
  Monitor,
  Gift,
  LogOut,
  Check,
  Trash2,
  Search,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import { Input as SearchInput } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useThemeContext } from "@/contexts/ThemeContext";

interface DashboardHeaderProps {
  onAskLuka?: () => void;
  pageTitle?: string;
  pageTitleLink?: string;
  subPageTitle?: string;
  extraHeaderContent?: React.ReactNode;
}

type FontSize = "A" | "AA" | "AAA";
const fontSizes: FontSize[] = ["A", "AA", "AAA"];

const DashboardHeader = ({
  onAskLuka,
  pageTitle,
  pageTitleLink,
  subPageTitle,
  extraHeaderContent,
}: DashboardHeaderProps) => {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifSearch, setNotifSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("luka-font-size") as FontSize) || "A";
    }
    return "A";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("font-size-a", "font-size-aa", "font-size-aaa");
    root.classList.add(`font-size-${fontSize.toLowerCase()}`);
    localStorage.setItem("luka-font-size", fontSize);
  }, [fontSize]);

  const cycleFontSize = () => {
    setFontSize((prev) => fontSizes[(fontSizes.indexOf(prev) + 1) % fontSizes.length]);
  };

  const [notifications, setNotifications] = useState([
    { id: "1", sender: "Cpt Group", initials: "CG", message: "New engagement created Cpt Group", read: false, time: "2m ago" },
    { id: "2", sender: "Cpt Group", initials: "CG", message: "1 team members added", read: false, time: "5m ago" },
    { id: "3", sender: "Cpt Group", initials: "CG", message: "New engagement created Cpt Group", read: true, time: "1h ago" },
    { id: "4", sender: "Cpt Group", initials: "CG", message: "1 team members added", read: true, time: "2h ago" },
    { id: "5", sender: "Cpt Group", initials: "CG", message: "You have been assigned as the packager for Cpt Group", read: true, time: "3h ago" },
    { id: "6", sender: "Cpt Group", initials: "CG", message: "New engagement created Cpt Group", read: true, time: "5h ago" },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleMarkAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const handleDeleteAll = () => setNotifications([]);

  const filteredNotifications = notifications.filter(
    (n) =>
      n.message.toLowerCase().includes(notifSearch.toLowerCase()) ||
      n.sender.toLowerCase().includes(notifSearch.toLowerCase())
  );

  const hasBreadcrumb = Boolean(pageTitle || subPageTitle);

  return (
    <header
      className="flex items-center px-6 bg-sidebar-bg text-white"
      style={{ height: "3.4rem" }}
    >
      {/* Left side - Breadcrumb / title */}
      <div className="flex-1 flex items-center gap-3">
        {hasBreadcrumb ? (
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold text-white/90 hover:text-white transition-colors">
              Dashboard
            </Link>
            {pageTitle && (
              <>
                <ChevronRight size={16} className="text-white/50" />
                <Link
                  to={pageTitleLink || "/engagements"}
                  className={`text-xl transition-colors ${
                    subPageTitle ? "font-medium text-white/70 hover:text-white" : "font-bold text-white"
                  }`}
                >
                  {pageTitle}
                </Link>
              </>
            )}
            {subPageTitle && (
              <>
                <ChevronRight size={16} className="text-white/50" />
                <span className="text-xl font-bold text-white">{subPageTitle}</span>
              </>
            )}
          </div>
        ) : (
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
        )}
        {extraHeaderContent}
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {/* Ask Luka */}
        <button
          onClick={onAskLuka}
          className="inline-flex items-center justify-center whitespace-nowrap h-8 px-3 rounded-full bg-gradient-to-r from-[#1C63A6] to-[#7A31D8] hover:from-[#1a5a96] hover:to-[#6a2bc2] text-white text-xs font-medium gap-1.5 shadow-md transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 animate-[spin_3s_linear_infinite]" />
          Ask Luka
        </button>

        {/* Font size accessibility */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={cycleFontSize}
              className="flex items-center justify-center h-9 px-2 cursor-pointer hover:bg-white/10 transition-colors gap-0.5"
              style={{ borderRadius: "12px" }}
            >
              {fontSizes.map((size) => (
                <span
                  key={size}
                  className={`font-semibold transition-all duration-200 ${
                    fontSize === size ? "text-white" : "text-white/40"
                  }`}
                  style={{ fontSize: size === "A" ? "11px" : size === "AA" ? "13px" : "15px" }}
                >
                  A
                </span>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Font Size: {fontSize === "A" ? "Default" : fontSize === "AA" ? "Medium" : "Large"}
          </TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 cursor-pointer hover:bg-white/10 transition-colors"
              style={{ borderRadius: "12px" }}
            >
              <div className="relative w-5 h-5">
                <Sun
                  className={`h-5 w-5 text-amber-300 absolute transition-all duration-500 ${
                    isDarkMode ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
                  }`}
                />
                <Moon
                  className={`h-5 w-5 text-white/80 absolute transition-all duration-500 ${
                    isDarkMode ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                  }`}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>{isDarkMode ? "Light Mode" : "Dark Mode"}</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <div
              className="flex items-center justify-center w-9 h-9 cursor-pointer hover:bg-white/10 transition-colors relative"
              style={{ borderRadius: "12px" }}
            >
              <Bell
                className={`h-5 w-5 text-white/80 ${
                  unreadCount > 0 ? "animate-[swing_1.5s_ease-in-out_infinite]" : ""
                }`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[380px] p-0 bg-card border border-border shadow-xl"
            style={{ borderRadius: "12px" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  className="scale-75"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <SearchInput
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  placeholder="Search"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors whitespace-nowrap"
              >
                <Check className="h-3.5 w-3.5" />
                Mark All As Read
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete All
              </button>
            </div>

            <ScrollArea className="max-h-[360px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                        )
                      }
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-semibold text-primary">{notif.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{notif.sender}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          <span className="text-primary">Notified you:</span> {notif.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                        <button
                          className="p-1 hover:bg-muted rounded transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="flex items-center justify-center w-9 h-9 cursor-pointer hover:bg-white/10 transition-colors"
              style={{ borderRadius: "12px" }}
            >
              <img src={userAvatar} alt="User" className="w-7 h-7 rounded-full object-cover" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <span>My Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span>Firm Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <span>Apps & Integrations</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
              <Gift className="h-5 w-5 text-muted-foreground" />
              <span>What's New</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-3 cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
