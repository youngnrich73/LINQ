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
import { createSupabaseBrowserClient } from "../lib/supabase-browser";
import { toAuthSession } from "../lib/supabase-session";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  session: AuthSession | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  login: (callbackUrl?: string) => void;
  logout: (redirectTo?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildLoginPath(callbackUrl?: string) {
  if (!callbackUrl) {
    return "/login";
  }
  const params = new URLSearchParams({ redirect: callbackUrl });
  return `/login?${params.toString()}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const pending = useRef<Promise<void> | null>(null);

  const syncSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    const nextSession = toAuthSession(data.session ?? null);
    setSession(nextSession);
    setStatus(nextSession ? "authenticated" : "unauthenticated");
  }, [supabase]);

  const refresh = useCallback(async () => {
    if (pending.current) {
      return pending.current;
    }
    const request = (async () => {
      setStatus("loading");
      try {
        await syncSession();
      } catch (error) {
        console.error("Failed to refresh Supabase session", error);
        setSession(null);
        setStatus("unauthenticated");
      } finally {
        pending.current = null;
      }
    })();
    pending.current = request;
    return request;
  }, [syncSession]);

  useEffect(() => {
    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const mapped = toAuthSession(nextSession);
      setSession(mapped);
      setStatus(mapped ? "authenticated" : "unauthenticated");
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [refresh, supabase]);

  const login = useCallback((callbackUrl?: string) => {
    const destination = buildLoginPath(callbackUrl);
    window.location.assign(destination);
  }, []);

  const logout = useCallback(
    async (redirectTo?: string) => {
      setStatus("loading");
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
        setSession(null);
        setStatus("unauthenticated");
        if (redirectTo) {
          window.location.href = redirectTo;
          return;
        }
      } catch (error) {
        console.error("Supabase sign-out failed", error);
        setStatus("unauthenticated");
        setSession(null);
        throw error instanceof Error ? error : new Error("logout_failed");
      }
      await refresh();
    },
    [refresh, supabase]
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
