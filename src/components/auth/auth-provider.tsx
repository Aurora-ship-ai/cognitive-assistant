"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/store/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { checkLocalAuth, setLoading } = useAuthStore();

  useEffect(() => {
    // Check local auth on mount
    checkLocalAuth();
    // If no local user, mark loading as done anyway
    const timer = setTimeout(() => {
      const state = useAuthStore.getState();
      if (state.isLoading) {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [checkLocalAuth, setLoading]);

  return <>{children}</>;
}
