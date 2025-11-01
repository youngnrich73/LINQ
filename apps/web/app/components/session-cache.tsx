"use client";

import { useEffect, type ReactNode } from "react";
import { useAuth } from "../state/auth-context";

const CACHE_KEY = "linq:user-meta";

export function SessionCache({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (session?.user) {
        const { id, email, name, image } = session.user;
        const payload = JSON.stringify({ id, email, name, avatar: image });
        window.localStorage.setItem(CACHE_KEY, payload);
      } else {
        window.localStorage.removeItem(CACHE_KEY);
      }
    } catch {
      // Ignore storage limitations.
    }
  }, [session]);

  return <>{children}</>;
}
