import { redirect } from "next/navigation";

// The mock design-preview mode has been retired for now — redirecting to
// the real marketing site. NOTE: the underlying component file
// (@/components/ProjectIvy) is NOT deleted — DashboardApp and several
// other real, Supabase-connected screens still import shared building
// blocks from it (Sidebar, TopBar, PropDetail, MCard, Badge, RCFG,
// TITLES, etc.). Only this standalone mock-preview route is disabled.
export default function DemoPage() {
  redirect("/");
}
