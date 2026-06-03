import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

/**
 * Creates a Stripe Customer Portal session for the signed-in mosque admin
 * and returns the redirect URL. The CRM Subscription page sends the user
 * there to manage payment method, view invoices, cancel, etc.
 */
export async function POST() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't open the portal — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const { data: mosque, error } = await supabase
    .from("mosques")
    .select("saas_stripe_customer_id")
    .eq("id", access.mosqueId)
    .single();

  if (error || !mosque?.saas_stripe_customer_id) {
    return NextResponse.json(
      { error: "No active subscription — finish Stripe Checkout first." },
      { status: 404 }
    );
  }

  try {
    const stripe = createStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: mosque.saas_stripe_customer_id,
      return_url: `${appUrl}/settings/subscription`,
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
