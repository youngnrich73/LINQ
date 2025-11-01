"use client";

import type { ReactNode } from "react";
import { DataProvider } from "./state/data-context";

export function Providers({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}
