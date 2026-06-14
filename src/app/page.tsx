"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/store/ui";
import { useAuthStore } from "@/lib/store/auth";
import { HomePage } from "@/components/pages/home-page";
import { LibraryPage } from "@/components/pages/library-page";
import { CapturePage } from "@/components/pages/capture-page";
import { KnowledgeTreePage } from "@/components/pages/knowledge-tree-page";
import { DigestPage } from "@/components/pages/digest-page";
import { SettingsPage } from "@/components/pages/settings-page";

export default function Page() {
  const { activeTab, setActiveTab } = useUIStore();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Redirect to home if not authenticated and trying to access protected pages
  useEffect(() => {
    if (!isLoading && !isAuthenticated && activeTab !== "home" && activeTab !== "settings") {
      setActiveTab("home");
    }
  }, [isAuthenticated, isLoading, activeTab, setActiveTab]);

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[var(--muted)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (activeTab) {
    case "library":
      return <LibraryPage />;
    case "capture":
      return <CapturePage />;
    case "knowledge-tree":
      return <KnowledgeTreePage />;
    case "digest":
      return <DigestPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
}
