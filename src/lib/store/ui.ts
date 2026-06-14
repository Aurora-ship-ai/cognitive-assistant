import { create } from "zustand";

type SidebarTab = "home" | "library" | "knowledge-tree" | "digest" | "capture" | "settings";

interface UIState {
  // Sidebar / navigation
  activeTab: SidebarTab;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Mobile
  isMobile: boolean;

  // Modal / dialog states
  showNewCaptureDialog: boolean;
  showNewDocumentDialog: boolean;
  showSettingsDialog: boolean;

  // Processing states
  isProcessing: boolean;
  processingMessage: string;

  // Actions
  setActiveTab: (tab: SidebarTab) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  setShowNewCaptureDialog: (show: boolean) => void;
  setShowNewDocumentDialog: (show: boolean) => void;
  setShowSettingsDialog: (show: boolean) => void;
  setProcessing: (processing: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "home",
  sidebarOpen: true,
  sidebarCollapsed: false,
  isMobile: false,
  showNewCaptureDialog: false,
  showNewDocumentDialog: false,
  showSettingsDialog: false,
  isProcessing: false,
  processingMessage: "",

  setActiveTab: (activeTab) => set({ activeTab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setIsMobile: (isMobile) =>
    set({ isMobile, sidebarOpen: !isMobile, sidebarCollapsed: isMobile }),
  setShowNewCaptureDialog: (show) => set({ showNewCaptureDialog: show }),
  setShowNewDocumentDialog: (show) => set({ showNewDocumentDialog: show }),
  setShowSettingsDialog: (show) => set({ showSettingsDialog: show }),
  setProcessing: (isProcessing, processingMessage = "") =>
    set({ isProcessing, processingMessage }),
}));
