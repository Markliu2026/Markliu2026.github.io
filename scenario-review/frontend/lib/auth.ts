"use client";

import { create } from "zustand";
import type { User } from "./types";

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  logout: () => void;
  hydrate: () => void;
}

const TOKEN_KEY = "sr_token";

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: (t) => {
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    }
    set({ token: t });
  },
  setUser: (u) => set({ user: u }),
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null });
  },
  hydrate: () => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t) set({ token: t });
    }
  },
}));

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
