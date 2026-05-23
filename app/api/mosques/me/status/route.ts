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
    .select(
      "onboarding_status, subscription_tier, subscription_status, saas_stripe_customer_id, name"
    )
    .eq("id", mosqueId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Defensive: Stripe webhook delivery can lag (sometimes minutes) or fail
  // entirely. If we have hard evidence of a successful checkout — both a
  // subscription_tier AND a saas_stripe_customer_id are set — surface the
  // mosque as "ready" so the launching page can redirect the admin into
  // their CRM without waiting on the async webhook.
  const derived =
    data?.onboarding_status === "ready" || data?.onboarding_status === "live"
      ? data.onboarding_status
      : data?.subscription_tier && data?.saas_stripe_customer_id
      ? "ready"
      : data?.onboarding_status ?? "in_progress";

  return NextResponse.json({
    status: derived,
    tier: data?.subscription_tier ?? null,
    name: data?.name ?? null,
  });
}
