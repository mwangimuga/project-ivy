import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron, serviceClientFromEnv, autopayCharge } from "@/lib/cron/jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

// Manual trigger. In production this runs from /api/cron/daily on the 3rd.
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = serviceClientFromEnv();
  if (!supabase) return NextResponse.json({ error: "Missing Supabase service credentials" }, { status: 500 });
  try {
    return NextResponse.json(await autopayCharge(supabase));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
