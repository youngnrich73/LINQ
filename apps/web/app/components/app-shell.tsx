"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useData } from "../state/data-context";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { settings } = useData();
  const pathname = usePathname();
  const onboardingView = pathname === "/onboarding" || !settings.onboardingDone;

  if (onboardingView) {
    return <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 space-y-6 p-6" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
