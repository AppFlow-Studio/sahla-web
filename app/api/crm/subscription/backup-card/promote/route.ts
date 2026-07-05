import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

/**
 * Promote the stored backup card to the subscription's default payment method.
 * Stripe's retry logic charges the subscription's `default_payment_method`
 * first, so this is the one-click "switch billing to the backup card" action
 * an admin takes when the primary card starts failing.
 */
export async function POST() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "Select a mosque to manage its billing." },
      { status: 403 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const { data: mosque, error } = await supabase
    .from("mosques")
    .select("saas_stripe_customer_id, saas_stripe_subscription_id, saas_backup_payment_method_id")
    .eq("id", access.mosqueId)
    .single();

  if (error || !mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }
  if (!mosque.saas_backup_payment_method_id) {
    return NextResponse.json(
      { error: "No backup card on file." },
      { status: 400 }
    );
  }
  if (!mosque.saas_stripe_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription." },
      { status: 400 }
    );
  }

  try {
    const stripe = createStripeClient();
    // Set on both the subscription and the customer so every retry path
    // (subscription default → customer default) lands on the backup card.
    await stripe.subscriptions.update(mosque.saas_stripe_subscription_id, {
      default_payment_method: mosque.saas_backup_payment_method_id,
    });
    if (mosque.saas_stripe_customer_id) {
      await stripe.customers.update(mosque.saas_stripe_customer_id, {
        invoice_settings: {
          default_payment_method: mosque.saas_backup_payment_method_id,
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to switch card";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
