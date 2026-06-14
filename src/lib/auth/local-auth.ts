/**
 * Local authentication system.
 * No server required — user data stored in localStorage.
 * Designed for single-user personal use.
 */

const STORAGE_KEY = "cognitive_assistant_user";

export interface LocalUser {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
  lastLoginAt: string;
}

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export function saveLocalUser(user: LocalUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function createLocalUser(name: string, email?: string): LocalUser {
  const user: LocalUser = {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    name,
    email: email || undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  saveLocalUser(user);
  return user;
}

export function updateLastLogin(): void {
  const user = getLocalUser();
  if (user) {
    user.lastLoginAt = new Date().toISOString();
    saveLocalUser(user);
  }
}

export function removeLocalUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
