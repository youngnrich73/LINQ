"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";

const CACHE_KEY = "linq:user-meta";

export function SessionCache({ children }: { children: ReactNode }) {
  const { data } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (data?.user) {
        const { id, email, name, image } = data.user;
        const payload = JSON.stringify({ id, email, name, avatar: image });
        window.localStorage.setItem(CACHE_KEY, payload);
      } else {
        window.localStorage.removeItem(CACHE_KEY);
      }
    } catch {
      // Ignore storage limitations.
    }
  }, [data]);

  return <>{children}</>;
}
