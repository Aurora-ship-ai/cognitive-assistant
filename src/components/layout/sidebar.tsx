"use client";

import { useUIStore } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import {
  Home,
  Library,
  Share2,
  GitGraph,
  Brain,
  Plus,
  Settings,
  ChevronLeft,
  PenLine,
} from "lucide-react";

const navItems = [
  { id: "home" as const, label: "首页", icon: Home },
  { id: "library" as const, label: "知识库", icon: Library },
  { id: "knowledge-tree" as const, label: "知识树", icon: Share2 },
  { id: "digest" as const, label: "深加工", icon: Brain },
  { id: "capture" as const, label: "快速捕获", icon: PenLine },
];

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, sidebarCollapsed, toggleSidebar, setShowNewCaptureDialog } =
    useUIStore();

  if (!sidebarOpen) return null;

  return (
    <aside
      className={cn(
        "h-full flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--border)]",
        "transition-all duration-200",
        sidebarCollapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo / Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-[var(--border)]">
        {!sidebarCollapsed && (
          <span className="font-semibold text-sm tracking-tight truncate">
            认知助手
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "ml-auto p-1.5 rounded-md hover:bg-[var(--muted-bg)] text-[var(--muted)]",
            "transition-colors",
            sidebarCollapsed && "ml-0"
          )}
          title={sidebarCollapsed ? "展开侧栏" : "折叠侧栏"}
        >
          <ChevronLeft
            size={16}
            className={cn(
              "transition-transform",
              sidebarCollapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "sidebar-link w-full text-left",
                isActive && "active",
                sidebarCollapsed && "justify-center px-0"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={() => setShowNewCaptureDialog(true)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90",
            "text-sm font-medium transition-opacity",
            sidebarCollapsed && "justify-center px-0"
          )}
          title={sidebarCollapsed ? "新建捕获" : undefined}
        >
          <Plus size={18} />
          {!sidebarCollapsed && <span>新建捕获</span>}
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "sidebar-link w-full text-left mt-1",
            activeTab === "settings" && "active",
            sidebarCollapsed && "justify-center px-0"
          )}
          title="设置"
        >
          <Settings size={18} />
          {!sidebarCollapsed && <span>设置</span>}
        </button>
      </div>
    </aside>
  );
}
