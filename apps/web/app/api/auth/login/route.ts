import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "../../../lib/supabase";
import { getBaseUrl, sanitizeRelativeRedirect } from "../../../lib/url";

function buildRedirectUrl(callbackUrl: string) {
  const destination = new URL("/login", getBaseUrl());
  destination.searchParams.set("callbackUrl", callbackUrl);
  return destination;
}

export function GET(request: NextRequest) {
  const callbackUrl = sanitizeRelativeRedirect(request.nextUrl.searchParams.get("callbackUrl"));
  return NextResponse.redirect(buildRedirectUrl(callbackUrl));
}

export async function POST(request: NextRequest) {
  let email: string | undefined;
  let callbackUrl: string | undefined;

  try {
    const payload = (await request.json()) as {
      email?: unknown;
      callbackUrl?: unknown;
    };
    email = typeof payload.email === "string" ? payload.email.trim() : undefined;
    callbackUrl = typeof payload.callbackUrl === "string" ? payload.callbackUrl : undefined;
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  email = email.toLowerCase();

  const sanitizedCallback = sanitizeRelativeRedirect(callbackUrl);
  const redirect = new URL("/api/auth/callback", getBaseUrl());
  redirect.searchParams.set("callbackUrl", sanitizedCallback);

  let supabase;
  try {
    supabase = getSupabaseServiceRoleClient();
  } catch (error) {
    console.error("Supabase credentials are not configured for magic links.", error);
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirect.toString(),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message ?? "magic_link_failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
