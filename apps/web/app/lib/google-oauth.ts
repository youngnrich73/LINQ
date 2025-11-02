export function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID ?? process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] ?? undefined;
}
