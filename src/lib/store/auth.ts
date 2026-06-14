import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import {
  type LocalUser,
  getLocalUser,
  createLocalUser,
  removeLocalUser,
  updateLastLogin,
} from "@/lib/auth/local-auth";

export type AuthMode = "local" | "supabase" | "none";

interface AuthState {
  // Supabase (future)
  supabaseUser: User | null;
  supabaseSession: Session | null;

  // Local
  localUser: LocalUser | null;

  // State
  authMode: AuthMode;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Computed
  userName: string | null;
  userId: string | null;

  // Actions - Local
  loginLocal: (name: string, email?: string) => void;
  logoutLocal: () => void;
  checkLocalAuth: () => void;

  // Actions - Supabase (future)
  setSupabaseUser: (user: User | null) => void;
  setSupabaseSession: (session: Session | null) => void;

  // Actions - General
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  supabaseUser: null,
  supabaseSession: null,
  localUser: null,
  authMode: "none",
  isLoading: true,
  isAuthenticated: false,
  userName: null,
  userId: null,

  // Local auth
  loginLocal: (name, email) => {
    const user = createLocalUser(name, email);
    set({
      localUser: user,
      authMode: "local",
      isAuthenticated: true,
      userName: user.name,
      userId: user.id,
      isLoading: false,
    });
  },

  logoutLocal: () => {
    removeLocalUser();
    set({
      localUser: null,
      authMode: "none",
      isAuthenticated: false,
      userName: null,
      userId: null,
    });
  },

  checkLocalAuth: () => {
    const user = getLocalUser();
    if (user) {
      updateLastLogin();
      set({
        localUser: user,
        authMode: "local",
        isAuthenticated: true,
        userName: user.name,
        userId: user.id,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  // Supabase
  setSupabaseUser: (supabaseUser) => {
    const isAuth = !!supabaseUser;
    set({
      supabaseUser,
      authMode: isAuth ? "supabase" : get().authMode,
      isAuthenticated: isAuth || get().localUser !== null,
      userName: supabaseUser?.email ?? get().localUser?.name ?? null,
      userId: supabaseUser?.id ?? get().localUser?.id ?? null,
    });
  },

  setSupabaseSession: (supabaseSession) => set({ supabaseSession }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: () => {
    const { authMode } = get();
    if (authMode === "local") {
      get().logoutLocal();
    }
    // Supabase signOut is handled by the AuthProvider
    set({
      supabaseUser: null,
      supabaseSession: null,
      isAuthenticated: false,
      userName: null,
      userId: null,
    });
  },
}));
