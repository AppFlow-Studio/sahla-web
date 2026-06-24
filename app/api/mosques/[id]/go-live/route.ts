import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { NextResponse } from "next/server";

const TIER_CONFIG: Record<string, { envKey: string; name: string }> = {
  core: { envKey: "STRIPE_PRICE_CORE", name: "Sahla Core" },
  core_crm: { envKey: "STRIPE_PRICE_CORE_CRM", name: "Sahla Core + CRM" },
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
  const tier: string = body.tier || "core_crm";

  const supabase = createAdminSupabaseClient();

  // Verify mosque exists and get data
  const { data: mosque, error: mosqueError } = await supabase
    .from("mosques")
    .select("id, name, email, onboarding_progress, onboarding_status, saas_stripe_customer_id")
    .eq("id", mosqueId)
    .single();

  if (mosqueError || !mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  // Already-onboarded mosques (paid + ready, or fully live) shouldn't kick
  // off a second Stripe Checkout. Route them through the same /launching
  // success URL the real Stripe flow uses, so re-launch UX matches first-time
  // UX exactly (no special "Push Updates" branch). Best-effort re-sync prayer
  // times because the cron sometimes drifts.
  if (
    mosque.onboarding_status === "live" ||
    mosque.onboarding_status === "ready"
  ) {
    const origin = new URL(request.url).origin;
    try {
      await fetch(`${origin}/api/mosques/${mosqueId}/prayer-sync`, {
        method: "POST",
        headers: {
          cookie: request.headers.get("cookie") || "",
          authorization: request.headers.get("authorization") || "",
        },
      });
    } catch {
      // Non-fatal — the rest of the data is already live.
    }
    const reLaunchAppUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({
      checkoutUrl: `${reLaunchAppUrl}/launching?payment=success`,
    });
  }

  // From here on we're handling a first-time launch → Stripe Checkout, so
  // the tier must map to a configured Stripe price.
  if (!TIER_CONFIG[tier]) {
    return NextResponse.json(
      { error: `Invalid tier: ${tier}. Must be one of: ${Object.keys(TIER_CONFIG).join(", ")}` },
      { status: 400 }
    );
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // ── Dev-only Stripe bypass ───────────────────────────────────────────────
  // When `BYPASS_STRIPE_CHECKOUT=1` is set in a non-production env, skip the
  // Stripe Checkout round-trip and write the exact post-payment state the
  // Stripe webhook would have written. Lets staging admins exercise the
  // /launching → CRM flow before the real STRIPE_PRICE_CORE_CRM is wired.
  // The NODE_ENV gate is hard-coded so a leaked env var can't take effect
  // in production builds.
  console.log(
    `[go-live] bypass check — NODE_ENV=${process.env.NODE_ENV}, BYPASS_STRIPE_CHECKOUT=${process.env.BYPASS_STRIPE_CHECKOUT ?? "<unset>"}`
  );
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.BYPASS_STRIPE_CHECKOUT === "1"
  ) {
    console.log(`[go-live] taking BYPASS path for mosque ${mosqueId} (tier=${tier})`);
    const thirtyDays = new Date();
    thirtyDays.setUTCDate(thirtyDays.getUTCDate() + 30);

    const { error: updateError } = await supabase
      .from("mosques")
      .update({
        subscription_status: "active",
        subscription_tier: tier,
        saas_stripe_subscription_id: `dev_bypass_${Date.now()}`,
        current_period_end: thirtyDays.toISOString(),
        onboarding_status: "ready",
      })
      .eq("id", mosqueId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Mirror the webhook's go_live progress flip.
    const updatedProgress = { ...progress, go_live: true };
    await supabase
      .from("mosques")
      .update({ onboarding_progress: updatedProgress })
      .eq("id", mosqueId);

    return NextResponse.json({
      checkoutUrl: `${appUrl}/launching?payment=success&dev_bypass=1`,
    });
  }

  const priceId = process.env[TIER_CONFIG[tier].envKey];
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe Price ID not configured for tier: ${tier}` },
      { status: 500 }
    );
  }

  try {
    const stripe = createStripeClient();

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
      success_url: `${appUrl}/launching?payment=success`,
      cancel_url: `${appUrl}/launching?payment=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
