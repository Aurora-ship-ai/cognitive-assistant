"use client";

import { useUIStore } from "@/lib/store/ui";
import { useAuthStore } from "@/lib/store/auth";
import { Menu, Settings, LogOut, User } from "lucide-react";

export function Topbar() {
  const { isMobile, sidebarOpen, toggleSidebar, activeTab, setActiveTab } =
    useUIStore();
  const { userName, isAuthenticated, authMode, signOut } = useAuthStore();

  const tabLabels: Record<string, string> = {
    home: "首页",
    library: "知识库",
    "knowledge-tree": "知识树",
    digest: "深加工",
    capture: "快速捕获",
    settings: "设置",
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-[var(--muted-bg)]"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Desktop: show when sidebar is collapsed */}
        {!isMobile && !sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-[var(--muted-bg)]"
          >
            <Menu size={20} />
          </button>
        )}

        <h1 className="text-sm font-medium text-[var(--muted)]">
          {tabLabels[activeTab]}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {isAuthenticated && userName ? (
          <>
            <span className="text-xs text-[var(--muted)] hidden sm:flex items-center gap-1.5">
              <User size={12} />
              {userName}
              {authMode === "local" && (
                <span className="text-[10px] px-1 py-0 rounded bg-[var(--muted-bg)]">本地</span>
              )}
            </span>
            <button
              onClick={() => setActiveTab("settings")}
              className="p-1.5 rounded-md hover:bg-[var(--muted-bg)] text-[var(--muted)]"
              title="设置"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={signOut}
              className="p-1.5 rounded-md hover:bg-[var(--muted-bg)] text-[var(--muted)]"
              title="退出"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <span className="text-xs text-[var(--muted)]">未登录</span>
        )}
      </div>
    </header>
  );
}
