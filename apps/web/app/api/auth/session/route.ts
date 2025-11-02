import { NextResponse } from "next/server";
import { getSessionFromCookies } from "../../../lib/server-session";

export async function GET() {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ session: null });
  }
  return NextResponse.json({ session });
}
