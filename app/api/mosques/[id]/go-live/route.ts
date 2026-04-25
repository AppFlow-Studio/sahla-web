import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { NextResponse } from "next/server";

const TIER_CONFIG: Record<string, { envKey: string; name: string }> = {
  core: { envKey: "STRIPE_PRICE_CORE", name: "Sahla Core" },
  complete: { envKey: "STRIPE_PRICE_COMPLETE", name: "Sahla Complete" },
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId || !session.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const body = await request.json().catch(() => ({}));
  const tier: string = body.tier || "complete";

  if (!TIER_CONFIG[tier]) {
    return NextResponse.json(
      { error: `Invalid tier: ${tier}. Must be one of: core, complete` },
      { status: 400 }
    );
  }

  const priceId = process.env[TIER_CONFIG[tier].envKey];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe Price ID not configured for tier: ${tier}` },
      { status: 500 }
    );
  }

  const supabase = createAdminSupabaseClient();

  // Verify mosque exists and get data
  const { data: mosque, error: mosqueError } = await supabase
    .from("mosques")
    .select("id, name, email, onboarding_progress, saas_stripe_customer_id")
    .eq("id", mosqueId)
    .single();

  if (mosqueError || !mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  const progress = (mosque.onboarding_progress as Record<string, boolean>) ?? {};

  // Verify required tasks are complete
  const requiredTasks = ["mosque_profile", "app_branding", "prayer_times", "jummah_setup", "stripe_connect", "preview_app", "go_live"];
  const incomplete = requiredTasks.filter((t) => !progress[t] && t !== "go_live");
  if (incomplete.length > 0) {
    return NextResponse.json(
      { error: `Required tasks not complete: ${incomplete.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const stripe = createStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create or reuse Stripe Customer on Sahla's platform account
    let customerId = mosque.saas_stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: mosque.email || undefined,
        name: mosque.name || undefined,
        metadata: { mosque_id: mosqueId, type: "saas" },
      });
      customerId = customer.id;

      await supabase
        .from("mosques")
        .update({ saas_stripe_customer_id: customerId, subscription_tier: tier })
        .eq("id", mosqueId);
    } else {
      // Update tier selection even if customer already exists
      await supabase
        .from("mosques")
        .update({ subscription_tier: tier })
        .eq("id", mosqueId);
    }

    // Create Stripe Checkout session with the selected tier's Price ID
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        mosque_id: mosqueId,
        type: "saas_subscription",
      },
      subscription_data: {
        metadata: {
          mosque_id: mosqueId,
          type: "saas_subscription",
        },
      },
      success_url: `${appUrl}/go_live?payment=success`,
      cancel_url: `${appUrl}/go_live?payment=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
