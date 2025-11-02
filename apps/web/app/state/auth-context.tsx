"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession } from "../lib/auth-types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  session: AuthSession | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  login: (callbackUrl?: string) => void;
  logout: (redirectTo?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getLoginUrl(callbackUrl?: string) {
  const url = new URL("/api/auth/login", window.location.origin);
  if (callbackUrl) {
    url.searchParams.set("callbackUrl", callbackUrl);
  }
  return url.toString();
}

async function requestLogout() {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error("logout_failed");
  }
}

async function fetchSession(): Promise<AuthSession | null> {
  const response = await fetch("/api/auth/session", { credentials: "include" });
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as { session: AuthSession | null };
  return payload.session ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const pending = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (pending.current) {
      return pending.current;
    }
    const request = (async () => {
      setStatus("loading");
      try {
        const nextSession = await fetchSession();
        if (nextSession) {
          setSession(nextSession);
          setStatus("authenticated");
        } else {
          setSession(null);
          setStatus("unauthenticated");
        }
      } catch {
        setSession(null);
        setStatus("unauthenticated");
      } finally {
        pending.current = null;
      }
    })();
    pending.current = request;
    return request;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    (callbackUrl?: string) => {
      window.location.href = getLoginUrl(callbackUrl);
    },
    []
  );

  const logout = useCallback(
    async (redirectTo?: string) => {
      try {
        await requestLogout();
      } finally {
        if (redirectTo) {
          window.location.href = redirectTo;
        } else {
          await refresh();
        }
      }
    },
    [refresh]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ session, status, refresh, login, logout }),
    [session, status, refresh, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
