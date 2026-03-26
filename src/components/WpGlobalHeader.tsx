import { useState, useEffect } from "react";
import { Bell, User, Sparkles, Moon, Sun, Zap, UserCircle, Building2, Settings, CreditCard, Monitor, Gift, LogOut, Check, Trash2, Search, MoreVertical, Type } from "lucide-react";
import { Input } from "@/components/wp-ui/input";
import { Button } from "@/components/wp-ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/wp-ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/wp-ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/wp-ui/popover";
import { Switch } from "@/components/wp-ui/switch";
import { ScrollArea } from "@/components/wp-ui/scroll-area";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AskLukaOverlay } from "@/components/AskLukaOverlay";
import { useThemeContext } from "@/contexts/ThemeContext";

export function WpGlobalHeader({ title }: { title?: string }) {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const [askLukaQuery,  setAskLukaQuery]  = useState("");
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [askLukaOpen,   setAskLukaOpen]   = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifSearch,   setNotifSearch]   = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  type FontSize = 'A' | 'AA' | 'AAA';
  const fontSizes: FontSize[] = ['A', 'AA', 'AAA'];
  const [fontSize, setFontSize] = useState<FontSize>(() =>
    (typeof window !== 'undefined' ? (localStorage.getItem('luka-font-size') as FontSize) : null) || 'A'
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-size-a', 'font-size-aa', 'font-size-aaa');
    root.classList.add(`font-size-${fontSize.toLowerCase()}`);
    localStorage.setItem('luka-font-size', fontSize);
  }, [fontSize]);

  const cycleFontSize = () =>
    setFontSize(prev => fontSizes[(fontSizes.indexOf(prev) + 1) % fontSizes.length]);

  const [notifications, setNotifications] = useState([
    { id: '1', sender: 'COM-CON', initials: 'CC', message: 'Engagement COM-CON-Dec312024 opened', read: false, time: '2m ago' },
    { id: '2', sender: 'System',  initials: 'SY', message: 'Long-term Asset workpaper ready for review', read: false, time: '5m ago' },
    { id: '3', sender: 'COM-CON', initials: 'CC', message: 'DSCR covenant breach flagged', read: true, time: '1h ago' },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifs = notifications.filter(n =>
    n.message.toLowerCase().includes(notifSearch.toLowerCase()) ||
    n.sender.toLowerCase().includes(notifSearch.toLowerCase())
  );

  return (
    <>
      <header className="h-14 flex items-center px-6 bg-background border-b border-border">
        {/* Left — page title */}
        <div className="flex-1">
          {title && <h1 className="text-xl font-bold" style={{ color: '#0c2d55' }}>{title}</h1>}
        </div>

        {/* Center — Ask Luka */}
        <div className="flex-1 flex justify-center">
          <div className="ask-luka-bar flex items-center bg-white dark:bg-card rounded-full pl-3 pr-1 py-1 gap-2 min-w-[300px] border border-[#dcdfe4] dark:border-[hsl(220_15%_30%)] transition-all duration-300">
            <Zap className="h-3.5 w-3.5 text-foreground flex-shrink-0" />
            <Input
              type="text"
              placeholder="Type here.."
              value={askLukaQuery}
              onChange={e => setAskLukaQuery(e.target.value)}
              className="border-0 bg-transparent h-6 text-sm text-foreground placeholder:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-0 flex-1 rounded-none"
            />
            <Button
              className="h-7 px-3 rounded-full bg-gradient-to-r from-[#1C63A6] to-[#7A31D8] hover:from-[#1a5a96] hover:to-[#6a2bc2] text-white text-xs font-medium gap-1.5 shadow-md"
              onClick={() => setAskLukaOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5 animate-[spin_3s_linear_infinite]" />
              Ask Luka
            </Button>
          </div>
        </div>

        {/* Right — controls */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* AI credits */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-9 h-9 cursor-pointer rounded-xl hover:bg-muted transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7A31D8] to-[#1C63A6] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">L</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>Luka AI Credits</TooltipContent>
          </Tooltip>

          {/* Font size */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center justify-center h-9 px-2 rounded-xl cursor-pointer hover:bg-muted transition-colors gap-0.5"
                onClick={cycleFontSize}
              >
                {fontSizes.map(size => (
                  <span
                    key={size}
                    className={`font-semibold transition-all duration-200 ${fontSize === size ? 'text-primary' : 'text-foreground'}`}
                    style={{ fontSize: size === 'A' ? '11px' : size === 'AA' ? '13px' : '15px' }}
                  >A</span>
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent>Font Size: {fontSize === 'A' ? 'Default' : fontSize === 'AA' ? 'Medium' : 'Large'}</TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer hover:bg-muted transition-colors"
                onClick={toggleTheme}
              >
                <div className="relative w-5 h-5">
                  <Sun  className={`h-5 w-5 text-amber-400 absolute transition-all duration-500 ${isDarkMode ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
                  <Moon className={`h-5 w-5 text-foreground absolute transition-all duration-500 ${isDarkMode ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer hover:bg-muted transition-colors relative">
                <Bell className={`h-5 w-5 text-foreground icon-bell ${unreadCount > 0 ? 'animate-[swing_1.5s_ease-in-out_infinite]' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[380px] p-0 bg-card border border-border shadow-xl rounded-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Notifications</span>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} className="scale-75" />
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground" />
                  <Input value={notifSearch} onChange={e => setNotifSearch(e.target.value)} placeholder="Search" className="h-8 pl-8 text-xs" />
                </div>
                <button onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors whitespace-nowrap">
                  <Check className="h-3.5 w-3.5" />Mark All Read
                </button>
                <button onClick={() => setNotifications([])} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors whitespace-nowrap">
                  <Trash2 className="h-3.5 w-3.5" />Delete All
                </button>
              </div>
              <ScrollArea className="max-h-[360px]">
                {filteredNotifs.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-sm text-foreground">No notifications</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredNotifs.map(notif => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                        onClick={() => setNotifications(p => p.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-semibold text-primary">{notif.initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{notif.sender}</p>
                          <p className="text-xs text-foreground mt-0.5 leading-relaxed">
                            <span className="text-primary">Notified you:</span> {notif.message}
                          </p>
                        </div>
                        <span className="text-[10px] text-foreground shrink-0">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer hover:bg-muted transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
                <UserCircle className="h-5 w-5 text-foreground" />
                <span>My Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
                <Building2 className="h-5 w-5 text-foreground" />
                <span>Firm Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-3 py-3 cursor-pointer" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-5 w-5 text-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
                <CreditCard className="h-5 w-5 text-foreground" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-3 py-3 cursor-pointer">
                <Gift className="h-5 w-5 text-foreground" />
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

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AskLukaOverlay open={askLukaOpen} onOpenChange={setAskLukaOpen} />
    </>
  );
}
