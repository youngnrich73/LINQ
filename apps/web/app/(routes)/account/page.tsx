import { redirect } from "next/navigation";
import { getSessionFromCookies } from "../../lib/server-session";
import { AccountDashboard } from "./account-dashboard";

export default function AccountPage() {
  const session = getSessionFromCookies();
  if (!session) {
    redirect(`/api/auth/login?callbackUrl=${encodeURIComponent("/account")}`);
  }
  return <AccountDashboard session={session} />;
}
