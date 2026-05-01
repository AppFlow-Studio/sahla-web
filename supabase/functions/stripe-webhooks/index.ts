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

function sahlaEmailHtml(body: string, preheader?: string): string {
  const logoUrl = "https://www.sahla.co/sahla-logo.png";
  const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter','Helvetica Neue',Arial,sans-serif";
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>Sahla</title>
  <style>
    :root{color-scheme:light only;}
    body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    body{margin:0!important;padding:0!important;width:100%!important;}
    [data-ogsc] body,[data-ogsc] table,[data-ogsc] td{background-color:#fffbf2!important;}
    u + .body{background-color:#fffbf2!important;}
    @media(prefers-color-scheme:dark){body,.dark-bg{background-color:#fffbf2!important;}}
    @media only screen and (max-width:620px){
      .email-card{width:100%!important;border-radius:0!important;}
      .email-body{padding-left:24px!important;padding-right:24px!important;}
      .email-footer{padding-left:24px!important;padding-right:24px!important;}
    }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background-color:#fffbf2;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#fffbf2;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}${"&zwnj;&nbsp;".repeat(30)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dark-bg" bgcolor="#fffbf2" style="background-color:#fffbf2;min-width:100%;">
  <tr>
  <td align="center" valign="top" bgcolor="#fffbf2" style="background-color:#fffbf2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;" align="center">
    <tr><td align="center" style="padding:48px 16px 28px;">
      <img src="${logoUrl}" alt="Sahla" width="80" height="80" style="display:block;width:80px;height:auto;border:0;outline:none;" />
    </td></tr>
    <tr><td align="center" style="padding:0 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card" bgcolor="#ffffff" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td class="email-body" style="padding:40px 36px 0;font-family:${sans};font-size:15px;line-height:1.7;color:#0A261E;">
          ${body}
        </td></tr>
        <tr><td class="email-body" style="padding:36px 36px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="height:1px;font-size:1px;line-height:1px;background-color:rgba(10,38,30,0.08);">&nbsp;</td>
          </tr></table>
        </td></tr>
        <tr><td align="center" class="email-body" style="padding:28px 36px 36px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr><td align="center" style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:1.55;color:rgba(10,38,30,0.55);padding-bottom:20px;">
              <em style="font-style:italic;color:#0A261E;">Sahla</em> means <em style="font-style:italic;color:#0A261E;">&ldquo;easy&rdquo;</em> in Arabic. That&rsquo;s the whole point.
            </td></tr>
            <tr><td align="center" style="font-family:'Brush Script MT','Segoe Script','Apple Chancery',cursive;font-size:28px;line-height:1.3;color:#0A261E;padding-bottom:6px;">The Sahla Team</td></tr>
            <tr><td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
                <td width="120" height="1" bgcolor="#B8922A" style="width:120px;height:1px;font-size:1px;line-height:1px;background-color:#B8922A;">&nbsp;</td>
              </tr></table>
            </td></tr>
            <tr><td align="center" style="padding-top:12px;font-family:${sans};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(10,38,30,0.3);">New York &middot; 2026</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" class="email-footer" style="padding:24px 16px 48px;font-family:${sans};font-size:11px;color:rgba(10,38,30,0.55);">
      <a href="https://www.sahla.co" style="color:#0A261E;text-decoration:none;">sahla.co</a>
      &nbsp;&nbsp;&middot;&nbsp;&nbsp;
      <a href="mailto:info@sahla.co" style="color:#0A261E;text-decoration:none;">info@sahla.co</a>
    </td></tr>
  </table>
  </td>
  </tr>
  </table>
</body>
</html>`;
}

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
      const mosqueName = mosqueData.name || "your mosque";
      const amountDue = `$${(invoice.amount_due / 100).toFixed(2)}`;

      await sendEmail(
        mosqueData.email,
        "Payment failed — action required",
        sahlaEmailHtml(`
          <p style="margin:0 0 6px;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#B8922A;">Action Required</p>
          <h1 style="font-size:22px;font-weight:600;color:#0A261E;margin:0 0 6px;line-height:1.3;">
            Payment unsuccessful
          </h1>
          <p style="margin:0 0 28px;font-size:13px;color:rgba(10,38,30,0.4);">${mosqueName}</p>

          <p style="margin:0 0 14px;color:rgba(10,38,30,0.7);font-size:15px;line-height:1.7;">
            Your latest payment of <strong style="color:#0A261E;">${amountDue}</strong> for <strong style="color:#0A261E;">${mosqueName}</strong> was unsuccessful.
          </p>

          <div style="margin:0 0 20px;background-color:#fffbf2;border-radius:10px;padding:16px 20px;border:1px solid rgba(10,38,30,0.06);">
            <p style="margin:0;color:rgba(10,38,30,0.7);font-size:14px;line-height:1.6;">Please update your payment method to avoid service interruption. You have a <strong style="color:#0A261E;">7-day grace period</strong> before your subscription is canceled.</p>
          </div>

          <p style="margin:0;color:rgba(10,38,30,0.7);font-size:15px;line-height:1.7;">
            If you have any questions, reply to this email and we'll help sort it out.
          </p>
        `, `Payment of ${amountDue} for ${mosqueName} was unsuccessful`)
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
