import Stripe from "stripe";

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
  status: "not_connected" | "pending" | "connected" | "issues";
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

  let status: "pending" | "connected" | "issues";
  if (charges_enabled) status = "connected";
  else if (past_due.length > 0) status = "issues";
  else status = "pending";

  return {
    status,
    charges_enabled,
    payouts_enabled,
    requirements: { currently_due, past_due },
    business_profile: { name: account.display_name ?? null },
  };
}
