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
      return "Sign-in is unavailable because Supabase credentials are not configured.";
    case "auth_failed":
    case "user_fetch_failed":
      return "We couldn’t verify your magic link. Please try again.";
    case "missing_token":
      return "The magic link is missing information. Request a new one to sign in.";
    case "unsupported_flow":
      return "This sign-in link isn’t supported. Request a new magic link.";
    case "access_denied":
      return "Permission was denied during sign-in.";
    default:
      return "Sign-in was cancelled. Please try again.";
  }
}
