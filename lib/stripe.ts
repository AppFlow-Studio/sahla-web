import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

// Fields to hydrate when retrieving a v2 account so we can read capability
// statuses and outstanding requirements. Spread into the `include` param at
// call sites, e.g. `{ include: [...ACCOUNT_INCLUDES] }`.
export const ACCOUNT_INCLUDES = [
  "configuration.merchant",
  "identity",
  "requirements",
] as const;

export type MosqueStripeStatus = {
  /**
   * - not_connected — no Stripe account linked yet
   * - pending       — account exists, Stripe is still waiting on the admin
   * - reviewing     — everything submitted; Stripe is verifying it
   * - connected     — charges enabled
   * - issues        — Stripe rejected something the admin must fix
   */
  status: "not_connected" | "pending" | "reviewing" | "connected" | "issues";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: {
    currently_due: string[];
    past_due: string[];
  };
  business_profile: {
    name: string | null;
  };
};

// Maps a v2 Accounts object onto the shape the onboarding UI expects.
// v1 exposed booleans (charges_enabled) and status arrays; v2 exposes
// per-capability statuses and a single requirements list, so we derive the
// equivalent here.
export function mapAccountStatus(
  account: Stripe.V2.Core.Account
): Omit<MosqueStripeStatus, "status"> & { status: Exclude<MosqueStripeStatus["status"], "not_connected"> } {
  const capabilities = account.configuration?.merchant?.capabilities;
  const charges_enabled = capabilities?.card_payments?.status === "active";
  const payouts_enabled =
    capabilities?.stripe_balance?.payouts?.status === "active";

  const entries = account.requirements?.entries ?? [];
  const currently_due: string[] = [];
  const past_due: string[] = [];
  for (const entry of entries) {
    // Only surface requirements the account holder can act on.
    if (entry.awaiting_action_from !== "user") continue;
    currently_due.push(entry.description);
    // A non-empty errors array means Stripe rejected submitted info — a real
    // problem, distinct from "not provided yet" (which is normal onboarding).
    if (entry.errors.length > 0) past_due.push(entry.description);
  }

  let status: "pending" | "reviewing" | "connected" | "issues";
  if (charges_enabled) status = "connected";
  else if (past_due.length > 0) status = "issues";
  // Nothing is awaiting the admin, yet charges still aren't live: Stripe has
  // everything and is verifying it. That's a wait, not an unfinished form, so
  // it gets its own state instead of nagging them to "complete setup".
  else if (currently_due.length === 0) status = "reviewing";
  else status = "pending";

  return {
    status,
    charges_enabled,
    payouts_enabled,
    requirements: { currently_due, past_due },
    business_profile: { name: account.display_name ?? null },
  };
}

const TIER_PRICE_ENV: Record<string, string> = {
  core: "STRIPE_PRICE_CORE",
  core_crm: "STRIPE_PRICE_CORE_CRM",
};

/** Price ID → tier, built from env at call time so a missing var can be logged. */
function priceToTier(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [tier, envKey] of Object.entries(TIER_PRICE_ENV)) {
    const priceId = process.env[envKey];
    if (priceId) map[priceId] = tier;
  }
  return map;
}

type ReconcileMosque = {
  id: string;
  saas_stripe_customer_id: string | null;
  onboarding_status: string | null;
  onboarding_progress: Record<string, unknown> | null;
};

/**
 * Reads the mosque's live subscription state straight from Stripe and writes the
 * post-payment state if one exists.
 *
 * Payment — not webhook delivery — is what completes onboarding. The
 * `checkout.session.completed` webhook is still the fast path, but it can be
 * undelivered, misconfigured, or pointed at the wrong endpoint, and until it
 * lands the mosque is stuck being asked to subscribe to something they already
 * pay for. Calling this on the Go Live surfaces makes payment sufficient on its
 * own; it writes exactly what the webhook would, and is safe to run repeatedly.
 *
 * Returns the tier when a subscription was found (whether or not the row needed
 * updating), or null when the mosque has no active subscription.
 */
export async function reconcileSaasSubscription(
  supabase: SupabaseClient,
  mosque: ReconcileMosque
): Promise<{ tier: string | null; alreadyLive: boolean } | null> {
  if (!mosque.saas_stripe_customer_id) return null;

  let subscription;
  try {
    const stripe = createStripeClient();
    const subs = await stripe.subscriptions.list({
      customer: mosque.saas_stripe_customer_id,
      status: "all",
      limit: 10,
    });
    subscription = subs.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );
  } catch (err) {
    console.error("reconcileSaasSubscription: Stripe lookup failed", err);
    return null;
  }

  if (!subscription) return null;

  const priceId = subscription.items.data[0]?.price?.id;
  const tier = (priceId ? priceToTier()[priceId] : undefined) ?? null;
  if (priceId && !tier) {
    // Without a tier the CRM access flag stays false, so make the cause loud.
    console.error(
      `reconcileSaasSubscription: no tier for price ${priceId} — check STRIPE_PRICE_* env`
    );
  }

  const alreadyLive = mosque.onboarding_status === "live";
  const item = subscription.items.data[0] as { current_period_end?: number } | undefined;
  const periodEnd =
    item?.current_period_end ??
    (subscription as unknown as { current_period_end?: number }).current_period_end;

  const progress = { ...(mosque.onboarding_progress ?? {}), go_live: true };

  const { error } = await supabase
    .from("mosques")
    .update({
      subscription_status: "active",
      saas_stripe_subscription_id: subscription.id,
      // Never demote a launched mosque back to "ready".
      onboarding_status: alreadyLive ? "live" : "ready",
      onboarding_progress: progress,
      ...(tier ? { subscription_tier: tier } : {}),
      ...(periodEnd
        ? { current_period_end: new Date(periodEnd * 1000).toISOString() }
        : {}),
    })
    .eq("id", mosque.id);

  if (error) {
    console.error("reconcileSaasSubscription: mosque update failed", error);
    return null;
  }

  return { tier, alreadyLive };
}
