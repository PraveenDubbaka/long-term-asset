import React from "react";
import { TooltipProvider } from "@/components/wp-ui/tooltip";
import { Sidebar } from "@/components/WpSidebar";
import { WpGlobalHeader } from "@/components/WpGlobalHeader";

interface WpLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function WpLayout({ children, title, showBackButton, onBack }: WpLayoutProps) {
  return (
    <TooltipProvider>
      <div className="flex h-screen bg-sidebar-bg">
        <Sidebar pageTitle={title} showBackButton={showBackButton} onBack={onBack} />
        <div className="layout-content flex-1 flex flex-col overflow-hidden">
          <div className="header-wrapper rounded-tl-2xl overflow-hidden bg-background">
            <WpGlobalHeader title={title} />
          </div>
          <main className="app-main flex-1 overflow-auto bg-background text-foreground rounded-bl-2xl">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
