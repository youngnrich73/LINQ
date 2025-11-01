"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { SessionCache } from "./components/session-cache";
import { ToastProvider } from "./components/toast-provider";
import { DataProvider } from "./state/data-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <SessionCache>
          <DataProvider>{children}</DataProvider>
        </SessionCache>
      </ToastProvider>
    </SessionProvider>
  );
}
