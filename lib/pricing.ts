import "server-only";
import { unstable_cache } from "next/cache";
import { createStripeClient } from "@/lib/stripe";

export type PlanTier = "core" | "core_crm";

export type PlanPrice = {
  tier: PlanTier;
  /** Amount in the smallest currency unit, e.g. 30000 for $300.00. */
  cents: number;
  /** Amount in whole currency units, e.g. 300 or 1.5. */
  amount: number;
  currency: string;
  /** Recurring interval ("month", "year", …) or null for one-off prices. */
  interval: string | null;
  /** Money only, e.g. "$300" or "$1.50" — no interval suffix. */
  formatted: string;
};

export type PlanPricing = Record<PlanTier, PlanPrice>;

const TIER_ENV: Record<PlanTier, string> = {
  core: "STRIPE_PRICE_CORE",
  core_crm: "STRIPE_PRICE_CORE_CRM",
};

// List amounts used only if Stripe is unreachable or a price ID is unset, so the
// UI never renders a blank price. The live Stripe price is the real source.
const FALLBACK_AMOUNT: Record<PlanTier, number> = { core: 300, core_crm: 325 };

/** "$300" for whole dollars, "$1.50" when there are cents. */
function formatPrice(amount: number, currency: string): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

async function fetchPlanPricing(): Promise<PlanPricing> {
  const stripe = createStripeClient();

  const entries = await Promise.all(
    (Object.keys(TIER_ENV) as PlanTier[]).map(async (tier) => {
      const priceId = process.env[TIER_ENV[tier]];
      let cents = FALLBACK_AMOUNT[tier] * 100;
      let currency = "usd";
      let interval: string | null = "month";

      if (priceId) {
        try {
          const price = await stripe.prices.retrieve(priceId);
          if (typeof price.unit_amount === "number") cents = price.unit_amount;
          currency = price.currency ?? currency;
          interval = price.recurring?.interval ?? null;
        } catch {
          // Keep the fallback amount if the price can't be read.
        }
      }

      const amount = cents / 100;
      const price: PlanPrice = {
        tier,
        cents,
        amount,
        currency,
        interval,
        formatted: formatPrice(amount, currency),
      };
      return [tier, price] as const;
    })
  );

  return Object.fromEntries(entries) as PlanPricing;
}

/**
 * Live plan prices, sourced from Stripe (via the STRIPE_PRICE_* env IDs) and
 * cached for 5 minutes. This is the single source of truth for every displayed
 * plan price — change the amount in Stripe (or repoint the env var at a new
 * price) and both checkout and all UI follow within the cache window.
 */
export const getPlanPricing = unstable_cache(fetchPlanPricing, ["plan-pricing"], {
  revalidate: 300,
  tags: ["plan-pricing"],
});
