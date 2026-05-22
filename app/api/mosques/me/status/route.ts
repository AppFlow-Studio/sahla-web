import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { resolveMosqueId } from "@/lib/supabase/resolveMosqueId";

/**
 * Lightweight status poll for the post-Stripe-checkout transitional page.
 * Returns the current onboarding lifecycle state for the signed-in admin's
 * mosque without leaking other columns.
 */
export async function GET() {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.orgId) {
    return NextResponse.json({ status: "no_org" }, { status: 200 });
  }

  const mosqueId = await resolveMosqueId(session.orgId);
  if (!mosqueId) {
    return NextResponse.json({ status: "no_mosque" }, { status: 200 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("mosques")
    .select("onboarding_status, subscription_tier, name")
    .eq("id", mosqueId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status: data?.onboarding_status ?? "in_progress",
    tier: data?.subscription_tier ?? null,
    name: data?.name ?? null,
  });
}
