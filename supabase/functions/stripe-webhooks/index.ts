import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!;
const stripe = new Stripe(stripeSecretKey);

// ─── Event Handlers ───

async function handleAccountUpdated(account: Stripe.Account) {
  // Resolve mosque ID from metadata or DB lookup
  let mosqueId = account.metadata?.mosque_id;

  if (!mosqueId) {
    const { data: mosque } = await supabase
      .from("mosques")
      .select("id")
      .eq("stripe_account_id", account.id)
      .single();

    if (!mosque) {
      console.warn(`No mosque found for Stripe account ${account.id}`);
      return;
    }
    mosqueId = mosque.id;
  }

  // Mark onboarding step if charges are now enabled
  if (account.charges_enabled) {
    const { data: mosque } = await supabase
      .from("mosques")
      .select("onboarding_progress")
      .eq("id", mosqueId)
      .single();
    if (mosque) {
      const progress = (mosque.onboarding_progress as Record<string, boolean>) || {};
      if (!progress.stripe_connect) {
        progress.stripe_connect = true;
        await supabase
          .from("mosques")
          .update({ onboarding_progress: progress })
          .eq("id", mosqueId);
        console.log(`Marked stripe_connect complete for mosque ${mosqueId}`);
      }
    }
  }

  await logActivity(mosqueId, "stripe_account_updated", "stripe", account.id, {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const mosqueId = paymentIntent.metadata?.mosque_id;
  if (!mosqueId) return;

  const type = paymentIntent.metadata?.type;

  if (type === "donation") {
    await supabase.from("donations").insert({
      mosque_id: mosqueId,
      amountGiven: paymentIntent.amount / 100,
      project_donated_to: paymentIntent.metadata?.project
        ? [paymentIntent.metadata.project]
        : ["general_fund"],
    });
  }

  await logActivity(mosqueId, "payment_succeeded", "payment", paymentIntent.id, {
    amount: paymentIntent.amount / 100,
    type: type || "unknown",
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription.id;

  await supabase
    .from("ad_subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);

  console.log(`Invoice paid for subscription ${subscriptionId}`);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription.id;

  await supabase
    .from("ad_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);

  console.log(`Invoice failed for subscription ${subscriptionId}`);
}

async function logActivity(
  mosqueId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  await supabase.from("activity_log").insert({
    mosque_id: mosqueId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}

// ─── Main Handler ───

Deno.serve(async (req: Request) => {
  const start = Date.now();

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[stripe-webhooks] ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
  }

  return new Response(
    JSON.stringify({
      success: true,
      event: event.type,
      duration_ms: Date.now() - start,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
