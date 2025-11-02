import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/overview";
  const error = requestUrl.searchParams.get("error");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (error) {
    const redirectUrl = new URL("/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", error);
    const description = requestUrl.searchParams.get("error_description");
    if (description) {
      redirectUrl.searchParams.set("error_description", description);
    }
    if (next) {
      redirectUrl.searchParams.set("redirect", next);
    }
    return NextResponse.redirect(redirectUrl);
  }

  const redirectDestination = new URL(next, requestUrl.origin);
  return NextResponse.redirect(redirectDestination);
}
