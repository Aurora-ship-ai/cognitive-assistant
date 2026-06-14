"use client";

import { useUIStore } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import {
  Home,
  Library,
  GitGraph,
  Brain,
  PenLine,
} from "lucide-react";

const mobileNavItems = [
  { id: "home" as const, label: "首页", icon: Home },
  { id: "capture" as const, label: "捕获", icon: PenLine },
  { id: "knowledge-tree" as const, label: "知识树", icon: GitGraph },
  { id: "digest" as const, label: "深加工", icon: Brain },
  { id: "library" as const, label: "知识库", icon: Library },
];

export function MobileNav() {
  const { activeTab, setActiveTab, isMobile } = useUIStore();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-0",
                "text-[var(--muted)] transition-colors",
                isActive && "text-[var(--foreground)]"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={cn("text-[10px]", isActive && "font-medium")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
