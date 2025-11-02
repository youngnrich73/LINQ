import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase-server";
import { toAuthSession } from "../../lib/supabase-session";
import { AccountDashboard } from "./account-dashboard";

export default async function AccountPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const params = new URLSearchParams({ redirect: "/account" });
    redirect(`/login?${params.toString()}`);
  }

  const mapped = toAuthSession(session);
  if (!mapped) {
    const params = new URLSearchParams({ redirect: "/account" });
    redirect(`/login?${params.toString()}`);
  }

  return <AccountDashboard session={mapped} />;
}
