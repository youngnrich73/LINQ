"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./toast-provider";
import { useAuth } from "../state/auth-context";

export function AuthFeedbackWatcher() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { push } = useToast();
  const { status } = useAuth();
  const previousStatus = useRef(status);

  useEffect(() => {
    const error = params?.get("error");
    if (!error) return;

    push({
      title: "Sign-in cancelled",
      description: getErrorMessage(error),
      variant: "destructive",
    });

    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete("error");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [params, pathname, push, router]);

  useEffect(() => {
    if (previousStatus.current === "loading") {
      previousStatus.current = status;
      return;
    }
    if (previousStatus.current === "unauthenticated" && status === "authenticated") {
      push({ title: "Signed in", description: "Welcome back to LINQ.", variant: "success" });
    }
    if (previousStatus.current === "authenticated" && status === "unauthenticated") {
      push({ title: "Signed out", description: "You are now signed out." });
    }
    previousStatus.current = status;
  }, [push, status]);

  return null;
}

function getErrorMessage(code: string) {
  switch (code) {
    case "config_error":
      return "Sign-in is unavailable because Google credentials are not configured.";
    case "token_exchange_failed":
    case "profile_fetch_failed":
    case "auth_failed":
      return "We couldn’t complete the Google sign-in flow. Please try again.";
    case "access_denied":
      return "Permission was denied during sign-in.";
    case "state_mismatch":
      return "The sign-in attempt was invalid. Please try again.";
    default:
      return "Sign-in was cancelled. Please try again.";
  }
}
