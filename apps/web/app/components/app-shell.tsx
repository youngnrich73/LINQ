"use client";

import { Suspense, type ReactNode } from "react";
import { AuthFeedbackWatcher } from "./auth-feedback-watcher";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Suspense fallback={null}>
          <AuthFeedbackWatcher />
        </Suspense>
        <Header />
        <main className="flex-1 space-y-6 p-6" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
