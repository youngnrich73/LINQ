import { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "../../../lib/auth-types";
import { attachSessionCookie } from "../../../lib/server-session";
import { getSupabaseServiceRoleClient } from "../../../lib/supabase";
import { getBaseUrl, sanitizeRelativeRedirect } from "../../../lib/url";

function redirectWithError(callbackUrl: string, code: string) {
  const destination = new URL(callbackUrl, getBaseUrl());
  destination.searchParams.set("error", code);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = sanitizeRelativeRedirect(searchParams.get("callbackUrl"));
  const accessToken = searchParams.get("access_token");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const type = searchParams.get("type");

  if (error || errorDescription) {
    return redirectWithError(callbackUrl, "access_denied");
  }

  if (!accessToken) {
    return redirectWithError(callbackUrl, "missing_token");
  }

  if (type && type !== "magiclink" && type !== "signup" && type !== "recovery") {
    return redirectWithError(callbackUrl, "unsupported_flow");
  }

  let supabase;
  try {
    supabase = getSupabaseServiceRoleClient();
  } catch {
    return redirectWithError(callbackUrl, "config_error");
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new Error(error?.message ?? "user_fetch_failed");
    }

    const profile: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      name:
        (typeof data.user.user_metadata?.full_name === "string" && data.user.user_metadata.full_name) ||
        (typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name) ||
        null,
      image: typeof data.user.user_metadata?.avatar_url === "string" ? data.user.user_metadata.avatar_url : null,
    };

    const response = NextResponse.redirect(new URL(callbackUrl, getBaseUrl()));
    attachSessionCookie(response, profile);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "auth_failed";
    return redirectWithError(callbackUrl, message);
  }
}
