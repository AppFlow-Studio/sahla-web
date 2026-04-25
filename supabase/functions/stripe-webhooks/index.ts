import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!;
const stripe = new Stripe(stripeSecretKey);

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");

// ─── Helpers ───

async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", eventId)
    .single();
  return !!data;
}

async function markEventProcessed(eventId: string, eventType: string) {
  await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: eventId, event_type: eventType })
    .onConflict("event_id")
    .ignore();
}

function isSaasSubscription(obj: { metadata?: Record<string, string> }): boolean {
  return obj.metadata?.type === "saas_subscription";
}

function getMosqueId(obj: { metadata?: Record<string, string> }): string | undefined {
  return obj.metadata?.mosque_id;
}

// ─── Notifications ───

async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sahla <noreply@sahla.app>",
        to,
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

async function notifySlack(message: string) {
  if (!slackWebhookUrl) {
    console.warn("SLACK_WEBHOOK_URL not set, skipping Slack notification");
    return;
  }
  try {
    await fetch(slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error("Failed to send Slack notification:", err);
  }
}

// ─── Price ID → tier mapping (loaded from env) ───

const PRICE_TO_TIER: Record<string, string> = {};
for (const [tier, envKey] of Object.entries({
  core: "STRIPE_PRICE_CORE",
  complete: "STRIPE_PRICE_COMPLETE",
})) {
  const priceId = Deno.env.get(envKey);
  if (priceId) PRICE_TO_TIER[priceId] = tier;
}

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

  // Check if this is a SaaS subscription by fetching from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (isSaasSubscription(subscription)) {
    const mosqueId = getMosqueId(subscription);
    if (!mosqueId) return;

    await supabase
      .from("mosques")
      .update({
        subscription_status: "active",
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("id", mosqueId);

    await logActivity(mosqueId, "saas_invoice_paid", "subscription", subscriptionId, {
      amount: invoice.amount_paid / 100,
      period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
    console.log(`SaaS invoice paid for mosque ${mosqueId}`);
    return;
  }

  // Fallback: ad subscription
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

  // Check if this is a SaaS subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (isSaasSubscription(subscription)) {
    const mosqueId = getMosqueId(subscription);
    if (!mosqueId) return;

    await supabase
      .from("mosques")
      .update({ subscription_status: "past_due" })
      .eq("id", mosqueId);

    // Notify mosque admin via email
    const { data: mosqueData } = await supabase
      .from("mosques")
      .select("name, email")
      .eq("id", mosqueId)
      .single();

    if (mosqueData?.email) {
      await sendEmail(
        mosqueData.email,
        "Payment failed — action required",
        `<p>Hi,</p>
        <p>Your latest payment of <strong>$${(invoice.amount_due / 100).toFixed(2)}</strong> for <strong>${mosqueData.name || "your mosque"}</strong> was unsuccessful.</p>
        <p>Please update your payment method in the CRM to avoid service interruption. You have a 7-day grace period before your subscription is canceled.</p>
        <p>— The Sahla Team</p>`
      );
    }

    await logActivity(mosqueId, "saas_invoice_failed", "subscription", subscriptionId, {
      amount: invoice.amount_due / 100,
    });
    console.log(`SaaS invoice FAILED for mosque ${mosqueId}`);
    return;
  }

  // Fallback: ad subscription
  await supabase
    .from("ad_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);

  console.log(`Invoice failed for subscription ${subscriptionId}`);
}

// ─── SaaS Subscription Handlers ───

async function handleSaasCheckoutCompleted(session: Stripe.Checkout.Session) {
  const mosqueId = session.metadata?.mosque_id;
  if (!mosqueId || !session.subscription) return;

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id;

  // Retrieve the full subscription to get period info and price
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? PRICE_TO_TIER[priceId] : undefined;

  await supabase
    .from("mosques")
    .update({
      subscription_status: "active",
      launched_at: new Date().toISOString(),
      saas_stripe_subscription_id: subscriptionId,
      subscription_tier: tier || null,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      onboarding_status: "live",
    })
    .eq("id", mosqueId);

  // Mark go_live onboarding step
  const { data: mosque } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  if (mosque) {
    const progress = (mosque.onboarding_progress as Record<string, boolean>) || {};
    progress.go_live = true;
    await supabase
      .from("mosques")
      .update({ onboarding_progress: progress })
      .eq("id", mosqueId);
  }

  await logActivity(mosqueId, "mosque_went_live", "subscription", subscriptionId, {
    tier: tier || "unknown",
    amount: subscription.items.data[0]?.price?.unit_amount
      ? subscription.items.data[0].price.unit_amount / 100
      : null,
  });

  // Notify dev team
  const { data: liveData } = await supabase
    .from("mosques")
    .select("name, slug, email")
    .eq("id", mosqueId)
    .single();

  const mosqueName = liveData?.name || mosqueId;
  const amount = subscription.items.data[0]?.price?.unit_amount
    ? `$${(subscription.items.data[0].price.unit_amount / 100).toFixed(0)}/mo`
    : "unknown";

  await notifySlack(
    `🚀 *${mosqueName}* just went LIVE!\n• Tier: ${tier || "unknown"} (${amount})\n• Mosque ID: ${mosqueId}\n• Slug: ${liveData?.slug || "—"}`
  );

  console.log(`Mosque ${mosqueId} went LIVE with tier ${tier}`);
}

async function handleSaasSubscriptionUpdated(subscription: Stripe.Subscription) {
  const mosqueId = getMosqueId(subscription);
  if (!mosqueId) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const tier = priceId ? PRICE_TO_TIER[priceId] : undefined;

  await supabase
    .from("mosques")
    .update({
      subscription_tier: tier || null,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("id", mosqueId);

  await logActivity(mosqueId, "saas_subscription_updated", "subscription", subscription.id, {
    tier: tier || "unknown",
    status: subscription.status,
  });

  console.log(`SaaS subscription updated for mosque ${mosqueId}, tier=${tier}`);
}

async function handleSaasSubscriptionDeleted(subscription: Stripe.Subscription) {
  const mosqueId = getMosqueId(subscription);
  if (!mosqueId) return;

  await supabase
    .from("mosques")
    .update({
      subscription_status: "canceled",
    })
    .eq("id", mosqueId);

  await logActivity(mosqueId, "saas_subscription_canceled", "subscription", subscription.id, {
    canceled_at: new Date().toISOString(),
  });

  console.log(`SaaS subscription CANCELED for mosque ${mosqueId}`);
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

  // Idempotency: skip already-processed events
  if (await isEventProcessed(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return new Response(
      JSON.stringify({ success: true, skipped: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === "saas_subscription") {
          await handleSaasCheckoutCompleted(session);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        if (isSaasSubscription(sub)) {
          await handleSaasSubscriptionUpdated(sub);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (isSaasSubscription(sub)) {
          await handleSaasSubscriptionDeleted(sub);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    await markEventProcessed(event.id, event.type);
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
