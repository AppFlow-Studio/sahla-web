import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { resolveMosqueId } from "@/lib/supabase/resolveMosqueId";
import { reconcileSaasSubscription } from "@/lib/stripe";

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
      "id, onboarding_status, subscription_tier, subscription_status, saas_stripe_customer_id, onboarding_progress, name"
    )
    .eq("id", mosqueId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stripe webhook delivery can lag by minutes, be misconfigured, or fail
  // outright, so don't make the admin's progress depend on it: ask Stripe
  // directly whether a subscription exists and write the post-payment state if
  // it does. This replaces an older heuristic that treated
  // "subscription_tier + saas_stripe_customer_id" as proof of payment — both of
  // those are written *before* Checkout opens, so an abandoned checkout used to
  // report ready.
  let status =
    data?.onboarding_status === "ready" || data?.onboarding_status === "live"
      ? data.onboarding_status
      : data?.onboarding_status ?? "in_progress";
  let tier = data?.subscription_tier ?? null;

  if (data?.saas_stripe_customer_id && status !== "ready" && status !== "live") {
    const synced = await reconcileSaasSubscription(supabase, {
      id: data.id as string,
      saas_stripe_customer_id: data.saas_stripe_customer_id,
      onboarding_status: data.onboarding_status,
      onboarding_progress: data.onboarding_progress as Record<string, unknown> | null,
    });
    if (synced) {
      status = synced.alreadyLive ? "live" : "ready";
      tier = synced.tier ?? tier;
    }
  }

  return NextResponse.json({
    status,
    tier,
    name: data?.name ?? null,
  });
}
