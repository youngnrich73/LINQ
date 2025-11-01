import { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "../../../lib/auth-types";
import {
  attachSessionCookie,
  clearStateCookie,
  readStateCookie,
  readStateCookiePayload,
} from "../../../lib/server-session";
import { getBaseUrl } from "../../../lib/url";

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
const googleRedirectUri = `${getBaseUrl()}/api/auth/callback`;

function redirectWithError(callbackUrl: string, code: string) {
  const destination = new URL(callbackUrl, getBaseUrl());
  destination.searchParams.set("error", code);
  return NextResponse.redirect(destination);
}

async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    client_id: googleClientId,
    client_secret: googleClientSecret,
    code,
    redirect_uri: googleRedirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error("token_exchange_failed");
  }
  return (await response.json()) as { access_token?: string };
}

async function fetchUserProfile(accessToken: string): Promise<AuthUser> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("profile_fetch_failed");
  }
  const payload = (await response.json()) as {
    sub: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    image: payload.picture,
  };
}

export async function GET(request: NextRequest) {
  const storedStateRaw = readStateCookie();
  const storedState = readStateCookiePayload(storedStateRaw);
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const callbackUrl = storedState?.callbackUrl ?? "/overview";

  if (!storedState || !state || storedState.state !== state) {
    return redirectWithError(callbackUrl, "state_mismatch");
  }

  if (error) {
    const response = redirectWithError(callbackUrl, "access_denied");
    if (storedStateRaw) {
      clearStateCookie(response);
    }
    return response;
  }

  if (!googleClientId || !googleClientSecret) {
    return redirectWithError(callbackUrl, "config_error");
  }

  if (!code) {
    return redirectWithError(callbackUrl, "missing_code");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      throw new Error("token_exchange_failed");
    }
    const profile = await fetchUserProfile(tokens.access_token);
    const response = NextResponse.redirect(new URL(callbackUrl, getBaseUrl()));
    attachSessionCookie(response, profile);
    clearStateCookie(response);
    return response;
  } catch (caught) {
    const reason = caught instanceof Error ? caught.message : "auth_failed";
    const response = redirectWithError(callbackUrl, reason);
    if (storedStateRaw) {
      clearStateCookie(response);
    }
    return response;
  }
}
