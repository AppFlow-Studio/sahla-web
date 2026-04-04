import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import RevenueClient from "./RevenueClient";

type Mosque = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  subscription_status: string;
  launched_at: string | null;
  created_at: string;
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

export default async function RevenuePage() {
  const supabase = createAdminSupabaseClient();

  const [{ data: mosques }, { data: healthScores }, { data: expenses }] = await Promise.all([
    supabase
      .from("mosques")
      .select("id, name, city, state, subscription_status, launched_at, created_at")
      .order("created_at"),
    supabase.from("latest_health_scores").select("mosque_id, overall_score, badge"),
    supabase.from("expenses").select("cost, frequency"),
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
    launchedAt: m.launched_at,
    health: deriveHealth(healthMap.get(m.id)),
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
      <RevenueClient mosques={mosqueData} monthlyBurn={monthlyBurn} />
    </div>
  );
}
