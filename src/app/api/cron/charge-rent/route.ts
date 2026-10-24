import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Triggered by Vercel Cron (see vercel.json) on the 1st of every month.
 * Calls `charge_monthly_rent()` which inserts a `charge` ledger entry
 * for every active lease — the arrears that client payments then pay
 * down (with overpayment rolling into a credit, per the financial spec).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase service credentials" }, { status: 500 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.rpc("charge_monthly_rent");

  if (error) {
    console.error("[Cron] charge_monthly_rent failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ charged: data?.length ?? 0 });
}
