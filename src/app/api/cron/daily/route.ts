import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron, serviceClientFromEnv, chargeRent, expireLeases, autopayCharge } from "@/lib/cron/jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The ONE scheduled job (see vercel.json) - runs every day at 01:00 UTC
 * (04:00 Nairobi). Consolidated deliberately: Vercel's free (Hobby) plan allows
 * only a couple of cron jobs, once a day each, so a single daily job that
 * decides what is due is the portable design.
 *
 *   every day   : end tenancies whose end date / notice date has passed
 *   1st of month: post monthly rent charges
 *   3rd of month: charge saved cards for autopay leases
 *
 * Manual run: /api/cron/daily?force=expire,rent,autopay  (still needs the secret)
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = serviceClientFromEnv();
  if (!supabase) return NextResponse.json({ error: "Missing Supabase service credentials" }, { status: 500 });

  const force = (req.nextUrl.searchParams.get("force") || "").split(",").filter(Boolean);
  const day = new Date().getUTCDate();
  const report: Record<string, unknown> = {};

  // Expiry first: an ended tenancy must not be charged this month's rent.
  try {
    report.expire = await expireLeases(supabase);
  } catch (e) {
    report.expire = { error: e instanceof Error ? e.message : "failed" };
  }
  if (day === 1 || force.includes("rent")) {
    try {
      report.rent = await chargeRent(supabase);
    } catch (e) {
      report.rent = { error: e instanceof Error ? e.message : "failed" };
    }
  }
  if (day === 3 || force.includes("autopay")) {
    try {
      report.autopay = await autopayCharge(supabase);
    } catch (e) {
      report.autopay = { error: e instanceof Error ? e.message : "failed" };
    }
  }
  return NextResponse.json({ day, ...report });
}
