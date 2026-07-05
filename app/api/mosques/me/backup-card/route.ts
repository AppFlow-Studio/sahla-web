import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { resolveMosqueId } from "@/lib/supabase/resolveMosqueId";

/**
 * Creates a Stripe Checkout session in `setup` mode to collect a *backup* card
 * for the SaaS subscription. Unlike the primary card (subscription-mode
 * Checkout in /go-live), setup mode saves the payment method to the customer
 * without charging it. The webhook records it as the mosque's backup card on
 * `checkout.session.completed`.
 *
 * `origin` in the body picks the return destination:
 *   - "onboarding" (default) → back to /launching to finish going live
 *   - "settings"             → back to the CRM subscription page
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId || !session.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mosqueId = await resolveMosqueId(session.orgId);
  if (!mosqueId) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const origin: string = body.origin === "settings" ? "settings" : "onboarding";

  const supabase = createAdminSupabaseClient();
  const { data: mosque, error } = await supabase
    .from("mosques")
    .select("saas_stripe_customer_id")
    .eq("id", mosqueId)
    .single();

  if (error || !mosque?.saas_stripe_customer_id) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const successUrl =
    origin === "settings"
      ? `${appUrl}/settings/subscription?backup=added`
      : `${appUrl}/launching?payment=success&backup=added`;
  const cancelUrl =
    origin === "settings"
      ? `${appUrl}/settings/subscription`
      : `${appUrl}/launching?payment=success`;

  try {
    const stripe = createStripeClient();
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: mosque.saas_stripe_customer_id,
      mode: "setup",
      // Attach to the customer so the saved card is reusable as a backup.
      metadata: {
        mosque_id: mosqueId,
        type: "saas_backup_card",
      },
      setup_intent_data: {
        metadata: {
          mosque_id: mosqueId,
          type: "saas_backup_card",
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create setup session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
