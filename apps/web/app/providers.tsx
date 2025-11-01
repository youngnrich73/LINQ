"use client";

import type { ReactNode } from "react";
import { SessionCache } from "./components/session-cache";
import { ToastProvider } from "./components/toast-provider";
import { DataProvider } from "./state/data-context";
import { AuthProvider } from "./state/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <SessionCache>
          <DataProvider>{children}</DataProvider>
        </SessionCache>
      </ToastProvider>
    </AuthProvider>
  );
}
