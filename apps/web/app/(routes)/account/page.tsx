import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import { AccountDashboard } from "./account-dashboard";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent("/account")}`);
  }
  return <AccountDashboard session={session} />;
}
