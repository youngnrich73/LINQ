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

    const description = params?.get("error_description");

    push({
      title: "Sign-in error",
      description: getErrorMessage(error, description ?? undefined),
      variant: "destructive",
    });

    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete("error");
    nextParams.delete("error_description");
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

function getErrorMessage(code: string, description?: string) {
  switch (code) {
    case "unauthorized_client":
    case "provider_disabled":
      return "Google sign-in is disabled. Add the OAuth client ID and secret in Supabase Authentication > Providers.";
    case "access_denied":
      return "Permission was denied during sign-in.";
    default:
      return description?.trim() ? description : "Sign-in was cancelled. Please try again.";
  }
}
