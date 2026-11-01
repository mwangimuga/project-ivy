import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import DashboardApp from "@/components/dashboard/DashboardApp";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) redirect("/login");
  if (profile.must_change_password) redirect("/change-password");

  return (
    <Suspense fallback={null}>
      <DashboardApp initialProfile={profile} />
    </Suspense>
  );
}
