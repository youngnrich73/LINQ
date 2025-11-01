import type { Session } from "@supabase/supabase-js";
import type { AuthSession } from "./auth-types";

function extractUserName(metadata: Record<string, unknown> | undefined, fallback?: string | null) {
  if (!metadata) return fallback ?? null;
  const fullName = typeof metadata["full_name"] === "string" ? (metadata["full_name"] as string) : undefined;
  if (fullName && fullName.trim()) {
    return fullName;
  }
  const name = typeof metadata["name"] === "string" ? (metadata["name"] as string) : undefined;
  if (name && name.trim()) {
    return name;
  }
  return fallback ?? null;
}

function extractAvatar(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;
  const avatarUrl = typeof metadata["avatar_url"] === "string" ? (metadata["avatar_url"] as string) : undefined;
  if (avatarUrl && avatarUrl.trim()) {
    return avatarUrl;
  }
  const picture = typeof metadata["picture"] === "string" ? (metadata["picture"] as string) : undefined;
  if (picture && picture.trim()) {
    return picture;
  }
  return null;
}

export function toAuthSession(session: Session | null): AuthSession | null {
  if (!session) {
    return null;
  }

  const user = session.user;
  const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now();
  const issuedAt = expiresAt - (session.expires_in ? session.expires_in * 1000 : 0);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: extractUserName(user.user_metadata, user.email),
      image: extractAvatar(user.user_metadata),
    },
    issuedAt: issuedAt || Date.now(),
    expiresAt,
  };
}
