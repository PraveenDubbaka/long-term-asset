import { useState, useRef, useCallback } from "react";
import { LukaAttachMenu, AttachedFilesBar, useAttachedFiles } from "@/components/luka/LukaAttachMenu";
import { VoiceRecordingOverlay } from "@/components/luka/VoiceRecordingOverlay";
import { X, Mic, Plus, Search, MessageSquare, Minus, Send, Inbox, Maximize2, ChevronLeft, ChevronRight, Clock, PanelLeftClose, MoreHorizontal, Zap, Building2 } from "lucide-react";
import { Button } from '@/components/wp-ui/button';
import { ScrollArea } from '@/components/wp-ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/wp-ui/tooltip';
import { cn } from "@/lib/utils";
import { PromptPicker } from "@/components/luka/PromptPicker";
import { LukaThinkingMessage } from "@/components/luka/LukaThinkingMessage";
import { GrossMarginResponse } from "@/components/luka/GrossMarginResponse";
import { LukaResponseActions } from "@/components/luka/LukaResponseActions";

interface AskLukaOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = ["bg-green-500", "bg-green-500", "bg-amber-500", "bg-green-500", "bg-green-500", "bg-green-500", "bg-purple-500", "bg-purple-500", "bg-amber-500", "bg-green-500", "bg-purple-500"];

const pinnedThreads = [
  { id: 1, name: "Emerging Trends in Accounting" },
  { id: 2, name: "Capital Asset Amortization" },
  { id: 3, name: "Generate Variance Analysis" },
  { id: 4, name: "Details on the report" },
  { id: 5, name: "Summarise uploaded report" },
  { id: 6, name: "Run Client Heath Check" },
  { id: 7, name: "Generate Trial Balance" },
  { id: 8, name: "Aged AR Analysis" },
  { id: 9, name: "General Ledger Analysis" },
  { id: 10, name: "Account Reconciliation" },
  { id: 11, name: "Notes Generator" },
];

const recentThreads = [
  { id: 12, name: "Emerging Trends in Accounting" },
  { id: 13, name: "Capital Asset Amortization" },
  { id: 14, name: "Generate Variance Analysis" },
  { id: 15, name: "Details on the report" },
  { id: 16, name: "Summarise uploaded report" },
  { id: 17, name: "Run Client Heath Check" },
  { id: 18, name: "Generate Trial Balance" },
  { id: 19, name: "Aged AR Analysis" },
];

const suggestions = [
  "#Variance Analysis",
  "#Account Reconciliation",
  "#Bank Reconciliation",
  "#Capital Asset Amortization",
];

/* Simple Luka flash icon using Lucide Zap */
function LukaIcon({ size = 20 }: { size?: number }) {
  return <Zap className="text-white" size={size} fill="white" strokeWidth={0} />;
}

export function AskLukaOverlay({ open, onOpenChange }: AskLukaOverlayProps) {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"threads" | "workspaces">("threads");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [viewMode, setViewMode] = useState<"full" | "half">("half");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [hashFilter, setHashFilter] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [richResponseType, setRichResponseType] = useState<"gross-margin" | null>(null);
  const [revealStep, setRevealStep] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<number | null>(null);
  const revealRef = useRef<number | null>(null);
  const { files: attachedFiles, addFiles, removeFile, clearAll: clearFiles } = useAttachedFiles();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);

    // Check if # is typed — open prompt picker
    const hashIdx = val.lastIndexOf("#");
    if (hashIdx !== -1) {
      setShowPromptPicker(true);
      setHashFilter(val.slice(hashIdx + 1));
    } else {
      setShowPromptPicker(false);
      setHashFilter("");
    }
  }, []);

  const handlePromptSelect = useCallback((promptLabel: string) => {
    setShowPromptPicker(false);
    setHashFilter("");
    setMessage("");
    setSentMessage(promptLabel);
    setIsThinking(true);
    setAiResponse(null);
    setDisplayedResponse("");
    setIsStreaming(false);
    setRichResponseType(null);
    setRevealStep(-1);
    if (streamRef.current) clearTimeout(streamRef.current);
    if (revealRef.current) clearTimeout(revealRef.current);

    const isGrossMargin = promptLabel.toLowerCase().includes("gross profit margin");

    // Simulate thinking then reveal
    setTimeout(() => {
      setIsThinking(false);

      if (isGrossMargin) {
        setRichResponseType("gross-margin");
        setAiResponse("__rich__");
        // Progressive reveal: 6 steps (0-5), 600ms apart
        let step = 0;
        const reveal = () => {
          setRevealStep(step);
          step++;
          if (step <= 5) {
            revealRef.current = window.setTimeout(reveal, 600);
          }
        };
        reveal();
      } else {
        const fullResponse = `Here's an overview of **${promptLabel}** with key insights and analysis.\n\nThis covers the essential metrics, trends, and recommendations based on your current financial data. The analysis includes year-over-year comparisons and highlights areas that may require attention.`;
        setAiResponse(fullResponse);
        setIsStreaming(true);
        let idx = 0;
        const stream = () => {
          if (idx < fullResponse.length) {
            const chunkSize = Math.floor(Math.random() * 3) + 1;
            idx = Math.min(idx + chunkSize, fullResponse.length);
            setDisplayedResponse(fullResponse.slice(0, idx));
            streamRef.current = window.setTimeout(stream, 15 + Math.random() * 25);
          } else {
            setIsStreaming(false);
          }
        };
        stream();
      }
    }, 2500);
  }, []);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    const msg = message.trim();
    setMessage("");
    setShowPromptPicker(false);
    setSentMessage(msg);
    setIsThinking(true);
    setAiResponse(null);
    setDisplayedResponse("");
    setIsStreaming(false);
    if (streamRef.current) clearTimeout(streamRef.current);

    const fullResponse = `Here's my response to "${msg}". This analysis covers the key aspects and provides actionable insights based on the available data.`;

    setTimeout(() => {
      setIsThinking(false);
      setAiResponse(fullResponse);
      setIsStreaming(true);
      let idx = 0;
      const stream = () => {
        if (idx < fullResponse.length) {
          const chunkSize = Math.floor(Math.random() * 3) + 1;
          idx = Math.min(idx + chunkSize, fullResponse.length);
          setDisplayedResponse(fullResponse.slice(0, idx));
          streamRef.current = window.setTimeout(stream, 15 + Math.random() * 25);
        } else {
          setIsStreaming(false);
        }
      };
      stream();
    }, 2500);
  }, [message]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !showPromptPicker && message.trim()) {
      e.preventDefault();
      handleSend();
    }
  }, [showPromptPicker, message, handleSend]);

  if (!open) return null;

  const allThreads = [...pinnedThreads, ...recentThreads];

  return (
    <>
      {/* Backdrop for half mode */}
      {viewMode === "half" && (
        <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 bg-background dark:bg-card overflow-hidden",
          "animate-in slide-in-from-right-5 fade-in zoom-in-[0.97] duration-400 ease-out",
          viewMode === "full"
            ? "left-14 rounded-tl-[1.25rem] rounded-bl-[1.25rem]"
            : "left-[45%] rounded-tl-[1.25rem] rounded-bl-[1.25rem] shadow-[-8px_0_30px_-10px_hsl(var(--primary)/0.15)] border-l border-border"
        )}
      >
        <div className="flex h-full min-w-0 w-full">
          {/* ===== LEFT SIDEBAR ===== */}
          <aside
            className={cn(
              "relative border-r border-border flex flex-col bg-background dark:bg-card transition-all duration-300 ease-in-out",
              sidebarExpanded ? "w-[260px]" : "w-[60px]"
            )}
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            {/* Collapse/Expand toggle */}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={cn(
                "absolute -right-3 top-[50px] z-20 w-6 h-6 rounded-full border border-border bg-background dark:bg-card shadow-sm flex items-center justify-center transition-opacity duration-200 hover:bg-muted",
                sidebarHovered ? "opacity-100" : "opacity-0"
              )}
            >
              {sidebarExpanded ? (
                <ChevronLeft className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>

            <TooltipProvider delayDuration={100}>
              {sidebarExpanded ? (
                /* ===== EXPANDED VIEW ===== */
                <>
                  {/* Header: Luka icon + name */}
                  <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0">
                        <LukaIcon size={18} />
                      </div>
                      <span className="text-lg font-bold text-foreground">Luka</span>
                    </div>

                    {/* Tabs: Threads / Workspaces */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setActiveTab("threads")}
                        className={cn(
                          "flex-1 h-8 rounded-[8px] text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                          activeTab === "threads"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60 dark:bg-muted/30 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Threads
                      </button>
                      <button
                        onClick={() => setActiveTab("workspaces")}
                        className={cn(
                          "flex-1 h-8 rounded-[8px] text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                          activeTab === "workspaces"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60 dark:bg-muted/30 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Workspaces
                      </button>
                    </div>
                  </div>

                  {/* Search + New Thread */}
                  <div className="px-3 pb-3 pt-1 flex items-center gap-2">
                    <div className="relative flex items-center h-9 flex-1 rounded-[10px] border border-border bg-background dark:bg-muted/20 hover:border-primary/30 transition-all duration-200 input-double-border">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        placeholder="Search"
                        className="h-full w-full bg-transparent pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none border-none"
                      />
                    </div>
                    <Button size="icon" className="h-9 w-9 shrink-0 rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Thread lists */}
                  <ScrollArea className="flex-1 px-1">
                    {/* Pinned */}
                    <div className="px-3 pb-1 pt-1">
                      <span className="text-xs font-semibold text-muted-foreground">Pinned</span>
                    </div>
                    <div className="pb-2">
                      {pinnedThreads.map((thread) => (
                        <button
                          key={thread.id}
                          className="w-full flex items-center px-4 py-2 text-left hover:bg-muted/60 dark:hover:bg-muted/30 rounded-lg transition-colors"
                        >
                          <span className="text-sm text-foreground truncate">{thread.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Recent */}
                    <div className="px-3 pb-1 pt-2">
                      <span className="text-xs font-semibold text-muted-foreground">Recent</span>
                    </div>
                    <div className="pb-2">
                      {recentThreads.map((thread) => (
                        <button
                          key={thread.id}
                          className="w-full flex items-center px-4 py-2 text-left hover:bg-muted/60 dark:hover:bg-muted/30 rounded-lg transition-colors"
                        >
                          <span className="text-sm text-foreground truncate">{thread.name}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Show More - sticky at bottom */}
                  <div className="px-4 py-3 border-t border-border">
                    <button
                      onClick={() => setShowAllRecent(!showAllRecent)}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {showAllRecent ? "Show Less" : "Show More"}
                    </button>
                  </div>
                </>
              ) : (
                /* ===== COLLAPSED ICON VIEW ===== */
                <>
                  {/* New thread button */}
                  <div className="flex justify-center pt-3 pb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" className="h-10 w-10 rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>New Thread</p></TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Tab icons */}
                  <div className="flex flex-col items-center gap-1 py-2 mx-2 border-t border-b border-border">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveTab("threads")}
                          className={cn("h-10 w-10 rounded-[10px] flex items-center justify-center transition-colors", activeTab === "threads" ? "bg-primary/15 hover:bg-primary/25" : "hover:bg-muted/60")}
                        >
                          <MessageSquare className={cn("h-5 w-5", activeTab === "threads" ? "text-primary" : "text-muted-foreground")} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>Threads</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveTab("workspaces")}
                          className={cn("h-10 w-10 rounded-[10px] flex items-center justify-center transition-colors", activeTab === "workspaces" ? "bg-primary/15 hover:bg-primary/25" : "hover:bg-muted/60")}
                        >
                          <Building2 className={cn("h-5 w-5", activeTab === "workspaces" ? "text-primary" : "text-muted-foreground")} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>Workspaces</p></TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Thread icons */}
                  <ScrollArea className="flex-1 py-1">
                    <div className="flex flex-col items-center gap-0.5">
                      {allThreads.map((thread, i) => (
                        <Tooltip key={thread.id}>
                          <TooltipTrigger asChild>
                            <button className="h-9 w-10 flex items-center justify-center rounded-lg hover:bg-muted/60 dark:hover:bg-muted/30 transition-colors relative">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <div className={cn("absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-background dark:border-card", statusColors[i % statusColors.length])} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right"><p>{thread.name}</p></TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Show More + Clock at bottom */}
                  <div className="flex flex-col items-center gap-1 pb-3 pt-2 border-t border-border mx-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="h-9 w-10 flex items-center justify-center rounded-lg hover:bg-muted/60 dark:hover:bg-muted/30 transition-colors">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>Recent</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setShowAllRecent(!showAllRecent)}
                          className="h-10 w-10 rounded-[10px] flex items-center justify-center transition-colors bg-primary/10 hover:bg-primary/15"
                        >
                          <MoreHorizontal className="h-5 w-5 text-primary" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p>{showAllRecent ? "Show Less" : "Show More"}</p></TooltipContent>
                    </Tooltip>
                  </div>
                </>
              )}
            </TooltipProvider>
          </aside>

          {/* ===== MAIN CONTENT AREA ===== */}
          <main className={cn("flex-1 min-w-0 flex flex-col overflow-hidden transition-all duration-300 ease-in-out", (isThinking || aiResponse) ? "bg-background" : "bg-gradient-to-b from-[hsl(210_60%_97%)] via-[hsl(260_40%_96%)] to-[hsl(300_30%_96%)] dark:from-[hsl(220_20%_12%)] dark:via-[hsl(260_15%_14%)] dark:to-[hsl(280_10%_13%)]")}>
            {/* Top right controls */}
            <div className="h-12 px-4 flex items-center justify-end gap-1">
              <TooltipProvider delayDuration={200}>
                {/* Sidebar toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    >
                      <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Toggle Sidebar</p></TooltipContent>
                </Tooltip>
                {/* Full-screen mode */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8", viewMode === "full" && "bg-muted")}
                      onClick={() => setViewMode(viewMode === "full" ? "half" : "full")}
                    >
                      <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>{viewMode === "full" ? "Half Mode" : "Full Mode"}</p></TooltipContent>
                </Tooltip>
                {/* Minimize */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Minimize</p></TooltipContent>
                </Tooltip>
                {/* Close */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Close</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {/* Messages area or welcome */}
              <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
                {!sentMessage ? (
                  /* Welcome state */
                  <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-[60vh]">
                    {/* Luka logo icon */}
                    <div className="mb-8 relative flex items-center justify-center w-24 h-24">
                      <div className="absolute -inset-4 luka-ambient-glow" />
                      <div className="absolute inset-0 luka-ambient-orb opacity-20" />
                      <div className="relative flex items-center justify-center w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] backdrop-blur-sm z-10 shadow-[0_0_30px_rgba(151,71,255,0.12)]">
                        <LukaIcon size={24} />
                      </div>
                    </div>

                    <h1 className="text-2xl font-semibold text-foreground mb-8 text-center">
                      How can I help you today?
                    </h1>

                    {/* Suggestion chips */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handlePromptSelect(s.replace("#", ""))}
                          className="px-4 py-2 rounded-[10px] border border-border bg-background dark:bg-card text-sm text-foreground hover:bg-muted/60 dark:hover:bg-muted/30 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Chat messages */
                  <div className="px-6 py-4 space-y-4 min-w-0 max-w-full overflow-hidden">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-4 py-3 rounded-[12px] bg-primary text-primary-foreground text-base">
                        {sentMessage}
                      </div>
                    </div>

                    {/* Unified Luka response container — icon stays in place */}
                    {(isThinking || aiResponse) && (
                      <div className="flex items-start gap-3 min-w-0 max-w-full">
                        <div className={cn(
                          "w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(265_80%_55%)] flex items-center justify-center shrink-0",
                          isThinking && "luka-thinking-spin"
                        )}>
                          <LukaIcon size={16} />
                        </div>
                        <div className="flex-1 pt-1.5 min-h-[28px] min-w-0 overflow-x-auto">
                          {isThinking ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground luka-thinking-text">
                                Thinking
                              </span>
                              <span className="flex gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-1" />
                                <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-2" />
                                <span className="w-1 h-1 rounded-full bg-primary/60 luka-dot luka-dot-3" />
                              </span>
                            </div>
                          ) : richResponseType === "gross-margin" ? (
                            <>
                              <GrossMarginResponse revealStep={revealStep} />
                              {revealStep >= 5 && <LukaResponseActions />}
                            </>
                          ) : (
                            <>
                              <div className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                                {displayedResponse}
                                {isStreaming && (
                                  <span className="inline-block w-0.5 h-4 bg-primary/70 ml-0.5 align-middle luka-thinking-text" />
                                )}
                              </div>
                              {!isStreaming && aiResponse && <LukaResponseActions />}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input - pinned to bottom */}
              <div className={cn("pb-6 pt-2", viewMode === "full" ? "px-12" : "px-6")}>
                <div className={cn("w-full mx-auto relative", viewMode === "full" ? "max-w-none" : "max-w-[700px]")}>
                  {/* Prompt Picker */}
                  <PromptPicker
                    open={showPromptPicker}
                    filter={hashFilter}
                    onSelect={handlePromptSelect}
                    onClose={() => { setShowPromptPicker(false); setHashFilter(""); }}
                  />

                  <div className="border border-border rounded-[12px] overflow-visible bg-background dark:bg-card hover:border-primary/30 transition-all duration-200 luka-gradient-border relative">
                    {/* Attached files bar */}
                    <AttachedFilesBar files={attachedFiles} onRemove={removeFile} onClearAll={clearFiles} />

                    <div className="px-4 pt-3 pb-2">
                      {/* Render input with blue # styling */}
                      <div className="relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={message}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Type # for prompts or just ask anything..."
                          className={cn(
                            "w-full bg-transparent h-9 placeholder:text-muted-foreground/70 outline-none border-none text-sm",
                            message.includes("#") ? "text-primary font-medium" : "text-foreground"
                          )}
                        />
                      </div>
                    </div>

                    {/* Bottom toolbar */}
                    <div className="px-3 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <LukaAttachMenu onFilesAdded={addFiles} />
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-[10px]">
                          <Inbox className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <div className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] border border-border bg-background dark:bg-muted/20 text-sm text-foreground">
                          <span className="text-amber-500">✨</span>
                          <span className="text-sm font-medium">Gemini 3 Flash</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[10px]" onClick={() => setVoiceOpen(true)}>
                          <Mic className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          className={cn(
                            "h-9 w-9 rounded-full transition-all duration-200",
                            message.trim()
                              ? "bg-gradient-to-br from-[#8649F1] to-[#2355A4] hover:opacity-90 text-white shadow-md"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          )}
                          onClick={handleSend}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Voice Recording Overlay */}
                  <VoiceRecordingOverlay
                    open={voiceOpen}
                    onClose={() => setVoiceOpen(false)}
                    onComplete={(text) => setMessage((prev) => (prev ? prev + " " + text : text))}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
