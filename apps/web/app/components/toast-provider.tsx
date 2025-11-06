"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
  durationMs?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  push(toast: ToastOptions): string;
  dismiss(id: string): void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (toast: ToastOptions) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...toast, id }]);
      const duration = toast.durationMs ?? 4000;
      if (duration > 0) {
        timers.current[id] = window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
      timers.current = {};
    };
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-3 px-4"
      role="status"
      aria-live="assertive"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={getToastClasses(toast.variant)}
          role={toast.variant === "destructive" ? "alert" : "status"}
        >
          <div className="pointer-events-auto flex flex-1 flex-col">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description ? <p className="text-sm text-muted-foreground">{toast.description}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="pointer-events-auto ml-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="알림 닫기"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}

function getToastClasses(variant: Toast["variant"]) {
  const base =
    "pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-lg border px-4 py-3 shadow-lg";
  switch (variant) {
    case "destructive":
      return `${base} border-destructive/40 bg-destructive/10 text-destructive`;
    case "success":
      return `${base} border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200`;
    default:
      return `${base} border-border bg-card/95 text-foreground backdrop-blur`;
  }
}
