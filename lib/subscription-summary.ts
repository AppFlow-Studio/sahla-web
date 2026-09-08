import "server-only";
import { createStripeClient } from "@/lib/stripe";
import { getPlanPricing, type PlanTier } from "@/lib/pricing";

export const TIER_LABEL: Record<PlanTier, string> = {
  core: "Sahla Core",
  core_crm: "Sahla Core + CRM",
};

export type LastPayment = {
  /** Formatted money, e.g. "$325.00". */
  amount: string;
  /** ISO date of the charge. */
  date: string;
  /** Stripe-hosted receipt, when the invoice has one. */
  receiptUrl: string | null;
  /**
   * True when this was a mid-cycle plan change rather than a normal bill. An
   * upgrade prorates, so the amount is a part-period difference and reads as
   * nonsense next to the monthly price unless it's labelled.
   */
  isProration: boolean;
};

export type SubscriptionSummary = {
  tier: PlanTier | null;
  tierLabel: string;
  /** Stripe subscription status ("active", "past_due", …). */
  status: string | null;
  /** ISO date the current period ends, i.e. the next charge. */
  renewsOn: string | null;
  cancelAtPeriodEnd: boolean;
  /** Undiscounted list price for the tier, e.g. "$325". */
  listPrice: string | null;
  /** Billing interval word, e.g. "month". */
  interval: string | null;
  lastPayment: LastPayment | null;
  /** True when Stripe applied a coupon or promo code to the last invoice. */
  discounted: boolean;
  card: { brand: string | null; last4: string | null } | null;
};

/** The mosque columns this summary needs. */
export type BillingRow = {
  subscription_tier: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  saas_stripe_customer_id: string | null;
  saas_stripe_subscription_id: string | null;
};

function formatMoney(amount: number, currency: string): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

function isTier(value: string | null): value is PlanTier {
  return value === "core" || value === "core_crm";
}

/**
 * What a mosque is on and what they actually paid for it.
 *
 * The list price comes from `getPlanPricing()` (Stripe, cached), but the
 * *charged* amount is read off the latest paid invoice — mosques on a
 * negotiated coupon or a promo code pay less than list, and showing them the
 * list price on a receipt screen would be a lie. Every Stripe read degrades
 * to the stored columns rather than failing the page.
 */
export async function getSubscriptionSummary(
  mosque: BillingRow
): Promise<SubscriptionSummary> {
  const tier = isTier(mosque.subscription_tier) ? mosque.subscription_tier : null;

  const pricing = await getPlanPricing().catch(() => null);
  const plan = tier && pricing ? pricing[tier] : null;

  const summary: SubscriptionSummary = {
    tier,
    tierLabel: tier ? TIER_LABEL[tier] : "Sahla",
    status: mosque.subscription_status,
    renewsOn: mosque.current_period_end,
    cancelAtPeriodEnd: false,
    listPrice: plan?.formatted ?? null,
    interval: plan?.interval ?? "month",
    lastPayment: null,
    discounted: false,
    card: null,
  };

  if (!mosque.saas_stripe_customer_id) return summary;

  const stripe = createStripeClient();
  const subscriptionId = mosque.saas_stripe_subscription_id;
  // Dev-bypass rows carry a synthetic id that Stripe would 404 on.
  const realSubscription =
    subscriptionId && !subscriptionId.startsWith("dev_bypass_")
      ? subscriptionId
      : null;

  const [subscription, invoices] = await Promise.all([
    realSubscription
      ? stripe.subscriptions
          .retrieve(realSubscription, { expand: ["default_payment_method"] })
          .catch(() => null)
      : Promise.resolve(null),
    stripe.invoices
      .list({ customer: mosque.saas_stripe_customer_id, limit: 5 })
      .catch(() => null),
  ]);

  if (subscription) {
    summary.status = subscription.status;
    summary.cancelAtPeriodEnd = !!subscription.cancel_at_period_end;

    // `current_period_end` moved from the subscription onto its items across
    // API versions — read either, keep the stored value if neither is there.
    const item = subscription.items?.data?.[0] as
      | { current_period_end?: number }
      | undefined;
    const unix =
      item?.current_period_end ??
      (subscription as unknown as { current_period_end?: number })
        .current_period_end;
    if (unix) summary.renewsOn = new Date(unix * 1000).toISOString();

    const pm = subscription.default_payment_method;
    if (pm && typeof pm !== "string" && pm.card) {
      summary.card = { brand: pm.card.brand ?? null, last4: pm.card.last4 ?? null };
    }
  }

  const paid = (invoices?.data ?? []).find(
    (inv) => inv.status === "paid" && (inv.amount_paid ?? 0) > 0
  );
  if (paid) {
    const amount = (paid.amount_paid ?? 0) / 100;
    summary.lastPayment = {
      amount: formatMoney(amount, paid.currency ?? "usd"),
      date: new Date((paid.created ?? 0) * 1000).toISOString(),
      receiptUrl: paid.hosted_invoice_url ?? null,
      isProration: paid.billing_reason === "subscription_update",
    };
    // Ask Stripe whether a discount was applied rather than inferring it from
    // "paid less than list" — a proration charge is also less than list, and
    // calling that a discount would be wrong.
    summary.discounted = (paid.total_discount_amounts ?? []).some(
      (d) => (d.amount ?? 0) > 0
    );
  }

  return summary;
}
