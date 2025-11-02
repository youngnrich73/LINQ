import { NextRequest, NextResponse } from "next/server";
import {
  attachStateCookie,
  createStateCookiePayload,
  stateCookieName,
} from "../../../lib/server-session";
import { getBaseUrl, sanitizeRelativeRedirect } from "../../../lib/url";
import { getGoogleClientId } from "../../../lib/google-oauth";
const googleRedirectUri = `${getBaseUrl()}/api/auth/callback`;

function buildErrorRedirect(callbackUrl: string, code: string) {
  const destination = new URL(callbackUrl, getBaseUrl());
  destination.searchParams.set("error", code);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const callbackParam = request.nextUrl.searchParams.get("callbackUrl");
  const callbackUrl = sanitizeRelativeRedirect(callbackParam);
  const googleClientId = getGoogleClientId();
  if (!googleClientId) {
    return buildErrorRedirect(callbackUrl, "config_error");
  }

  const { state, encoded } = createStateCookiePayload(callbackUrl);
  const authParams = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "consent",
    access_type: "offline",
    state,
  });

  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
  const response = NextResponse.redirect(redirectUrl);
  attachStateCookie(response, encoded);
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ cleared: true });
  response.cookies.delete({ name: stateCookieName(), path: "/" });
  return response;
}
