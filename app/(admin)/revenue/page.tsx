import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import RevenueClient from "./RevenueClient";

type Mosque = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  subscription_status: string;
  subscription_tier: string | null;
  launched_at: string | null;
  created_at: string;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
};

type HealthScore = {
  mosque_id: string;
  overall_score: number;
  badge: string | null;
};

function deriveHealth(score: HealthScore | undefined): string {
  if (!score) return "No Data";
  const s = score.overall_score;
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "At Risk";
  return "Churned";
}

async function fetchPaymentStats() {
  const stripe = createStripeClient();
  const stats = { succeeded: 0, uncaptured: 0, refunded: 0, failed: 0 };

  // Fetch succeeded charges
  for await (const charge of stripe.charges.list({ limit: 100 })) {
    if (charge.status === "succeeded") {
      stats.succeeded += charge.amount - charge.amount_refunded;
      if (charge.amount_refunded > 0) {
        stats.refunded += charge.amount_refunded;
      }
    } else if (charge.status === "failed") {
      stats.failed += charge.amount;
    } else if (charge.status === "pending") {
      stats.uncaptured += charge.amount;
    }
  }

  // Convert from cents to dollars
  return {
    succeeded: stats.succeeded / 100,
    uncaptured: stats.uncaptured / 100,
    refunded: stats.refunded / 100,
    failed: stats.failed / 100,
  };
}

export default async function RevenuePage() {
  const supabase = createAdminSupabaseClient();

  const [{ data: mosques }, { data: healthScores }, { data: expenses }, paymentStats, { data: donations }] =
    await Promise.all([
      supabase
        .from("mosques")
        .select("id, name, city, state, subscription_status, subscription_tier, launched_at, created_at, stripe_account_id, stripe_charges_enabled")
        .order("created_at"),
      supabase.from("latest_health_scores").select("mosque_id, overall_score, badge"),
      supabase.from("expenses").select("cost, frequency"),
      fetchPaymentStats(),
      supabase
        .from("donations")
        .select("id, mosque_id, amountGiven, project_donated_to, date, status, stripe_payment_intent_id, currency")
        .order("date", { ascending: false }),
    ]);

  const allMosques: Mosque[] = mosques ?? [];
  const health: HealthScore[] = healthScores ?? [];
  const healthMap = new Map(health.map((h) => [h.mosque_id, h]));

  const mosqueData = allMosques.map((m) => ({
    id: m.id,
    name: m.name,
    city: m.city ?? "—",
    state: m.state ?? "—",
    subscriptionStatus: m.subscription_status,
    subscriptionTier: m.subscription_tier,
    launchedAt: m.launched_at,
    health: deriveHealth(healthMap.get(m.id)),
    stripeConnected: !!m.stripe_account_id && m.stripe_charges_enabled,
  }));

  const mosqueNameMap = Object.fromEntries(allMosques.map((m) => [m.id, m.name]));
  const donationData = (donations ?? []).map((d) => ({
    id: d.id,
    mosqueId: d.mosque_id,
    mosqueName: mosqueNameMap[d.mosque_id] ?? "Unknown",
    amount: d.amountGiven ?? 0,
    project: (d.project_donated_to as string[] | null)?.[0] ?? "general_fund",
    date: d.date,
    status: (d.status as string) ?? "succeeded",
    stripePaymentIntentId: d.stripe_payment_intent_id as string | null,
    currency: (d.currency as string) ?? "usd",
  }));

  const allExpenses = (expenses ?? []) as { cost: number; frequency: string }[];
  const monthlyBurn = allExpenses
    .filter((e) => e.frequency === "monthly")
    .reduce((s, e) => s + e.cost, 0)
    + allExpenses
      .filter((e) => e.frequency === "yearly")
      .reduce((s, e) => s + e.cost, 0) / 12;

  return (
    <div>
      <RevenueClient mosques={mosqueData} monthlyBurn={monthlyBurn} paymentStats={paymentStats} donations={donationData} />
    </div>
  );
}
