import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { AuthSession, AuthUser } from "./auth-types";

const SESSION_COOKIE = "linq_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const STATE_COOKIE = "linq_auth_state";
const STATE_MAX_AGE_SECONDS = 60 * 10; // 10 minutes

const authSecret =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET ?? "development-secret";

const usingFallbackSecret =
  !process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET && !process.env.JWT_SECRET;

if (usingFallbackSecret && process.env.NODE_ENV !== "production") {
  console.warn("Auth secret not configured. Falling back to an insecure development secret.");
}

function sign(value: string) {
  return createHmac("sha256", authSecret).update(value).digest("hex");
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createSessionToken(user: AuthUser): string {
  const payload = JSON.stringify({
    user,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    version: 1,
  });
  const encoded = toBase64Url(payload);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function readSessionToken(token: string | undefined | null): AuthSession | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const provided = signature;
  if (expected.length !== provided.length) return null;
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  if (expectedBuffer.length !== providedBuffer.length) return null;
  try {
    if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as AuthSession & { version?: number };
    if (!payload?.user?.id) {
      return null;
    }
    if (typeof payload.expiresAt === "number" && payload.expiresAt < Date.now()) {
      return null;
    }
    return {
      user: payload.user,
      issuedAt: payload.issuedAt ?? Date.now(),
      expiresAt: payload.expiresAt ?? Date.now(),
    };
  } catch {
    return null;
  }
}

export function attachSessionCookie(response: NextResponse, user: AuthUser) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
}

export function getSessionFromCookies(): AuthSession | null {
  const cookieValue = cookies().get(SESSION_COOKIE)?.value;
  return readSessionToken(cookieValue);
}

export function createStateCookiePayload(callbackUrl: string) {
  const state = randomBytes(16).toString("hex");
  const payload = { state, callbackUrl };
  return { state, encoded: toBase64Url(JSON.stringify(payload)) };
}

export function readStateCookiePayload(value: string | undefined | null): { state: string; callbackUrl: string } | null {
  if (!value) return null;
  try {
    return JSON.parse(fromBase64Url(value)) as { state: string; callbackUrl: string };
  } catch {
    return null;
  }
}

export function attachStateCookie(response: NextResponse, payload: string) {
  response.cookies.set({
    name: STATE_COOKIE,
    value: payload,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: STATE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function readStateCookie(): string | undefined {
  return cookies().get(STATE_COOKIE)?.value;
}

export function clearStateCookie(response: NextResponse) {
  response.cookies.delete({ name: STATE_COOKIE, path: "/" });
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function stateCookieName() {
  return STATE_COOKIE;
}
