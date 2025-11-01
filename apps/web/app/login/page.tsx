"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";

function getSiteOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  return "";
}

export default function LoginPage() {
  const params = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const redirectTarget = params?.get("redirect") ?? "/overview";
  const origin = getSiteOrigin();
  const baseRedirect = origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = `${baseRedirect.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(redirectTarget)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-6 py-16">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-background p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in to LINQ</h1>
          <p className="text-sm text-muted-foreground">
            Continue with your Google account to access your relationship workspace.
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#1d4ed8",
                  brandAccent: "#2563eb",
                },
              },
            },
          }}
          view="sign_in"
          providers={["google"]}
          onlyThirdPartyProviders
          redirectTo={redirectTo}
        />
      </div>
    </div>
  );
}
