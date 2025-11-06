import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseConfigError,
  type SupabaseAuthProvider,
  getSupabaseServerClient,
} from "../../../lib/supabase";
import { getBaseUrl, sanitizeRelativeRedirect } from "../../../lib/url";

function isValidProvider(value: string): value is SupabaseAuthProvider {
  return /^[a-z0-9_-]+$/i.test(value);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const providerParam = searchParams.get("provider");
  const callbackUrl = sanitizeRelativeRedirect(searchParams.get("callbackUrl"));

  if (!providerParam || !isValidProvider(providerParam)) {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 });
  }

  const redirectTo = new URL("/api/auth/callback", getBaseUrl());
  redirectTo.searchParams.set("callbackUrl", callbackUrl);

  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(
        "Supabase configuration error while starting OAuth sign-in.",
        error.missingVariables.length ? { missing: error.missingVariables } : { code: error.code }
      );
      return NextResponse.json({ error: error.code }, { status: 500 });
    }
    throw error;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: providerParam,
    options: {
      redirectTo: redirectTo.toString(),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    console.error("Failed to create Supabase OAuth sign-in URL.", error);
    return NextResponse.json({ error: error?.message ?? "oauth_failed" }, { status: 400 });
  }

  return NextResponse.redirect(data.url, { status: 302 });
}
