export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function sanitizeRelativeRedirect(target: string | null | undefined, fallback = "/overview") {
  if (!target) return fallback;
  try {
    const url = new URL(target, "https://example.com");
    if (url.origin !== "https://example.com") {
      return fallback;
    }
    return url.pathname + (url.search ?? "") + (url.hash ?? "");
  } catch {
    return fallback;
  }
}
