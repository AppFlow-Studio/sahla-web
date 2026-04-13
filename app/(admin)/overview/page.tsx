import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { APPS } from "../builds/data";
import OverviewClient from "./OverviewClient";

export default async function OverviewPage() {
  const supabase = createAdminSupabaseClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ data: mosques }, { data: pipelineRows }, { count: userCount }, { data: activityRows }, { data: prayerRows }, { data: iqamahRows }, { data: cachedPrayerRows }, { data: donationRows }, { data: speakerRows }, { data: contentRows }, { data: signupRows }, { data: adminLoginRows }] =
    await Promise.all([
      supabase
        .from("mosques")
        .select("id, name, onboarding_status, subscription_status, onboarding_progress, stripe_account_id, created_at, launched_at"),
      supabase.from("pipeline_stages").select("stage"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("activity_log")
        .select("action, actor_name, entity_name, mosque_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("todays_prayers")
        .select("mosque_id"),
      supabase
        .from("iqamah_config")
        .select("mosque_id, prayer_name"),
      supabase
        .from("prayers")
        .select("mosque_id"),
      supabase
        .from("donations")
        .select("mosque_id, amountGiven"),
      supabase
        .from("speaker_data")
        .select("mosque_id"),
      supabase
        .from("content_items")
        .select("mosque_id, type"),
      // user signups in last 30 days (for growth metric)
      supabase
        .from("activity_log")
        .select("mosque_id, created_at")
        .eq("action", "user_signup")
        .gte("created_at", thirtyDaysAgo),
      // most recent admin_login per mosque (for inactive detection)
      supabase
        .from("activity_log")
        .select("mosque_id, created_at")
        .eq("action", "admin_login")
        .order("created_at", { ascending: false }),
    ]);

  const allMosques = mosques ?? [];

  /* onboarding status buckets */
  const onboardingStatusCounts = { pipeline: 0, in_progress: 0, live: 0 };
  for (const m of allMosques) {
    const s = m.onboarding_status as keyof typeof onboardingStatusCounts;
    if (s in onboardingStatusCounts) onboardingStatusCounts[s]++;
  }

  /* subscription buckets */
  const subscriptionCounts = { trial: 0, active: 0, canceled: 0, other: 0 };
  for (const m of allMosques) {
    const s = m.subscription_status as string;
    if (s === "trial" || s === "active" || s === "canceled") {
      subscriptionCounts[s]++;
    } else {
      subscriptionCounts.other++;
    }
  }

  /* pipeline stage counts */
  type Stage = "lead" | "contacted" | "demo" | "contract" | "onboarding" | "live";
  const pipelineCounts: Record<Stage, number> = {
    lead: 0,
    contacted: 0,
    demo: 0,
    contract: 0,
    onboarding: 0,
    live: 0,
  };
  for (const row of pipelineRows ?? []) {
    const s = (row.stage ?? "lead") as Stage;
    if (s in pipelineCounts) pipelineCounts[s]++;
  }

  /* onboarding task completion rates */
  const TASK_KEYS = [
    "mosque_profile", "app_branding", "prayer_times", "jummah_setup",
    "speakers", "programs", "events", "stripe_connect",
    "donations", "ads_config", "invite_admins",
    "preview_app", "launch_materials", "go_live",
  ];
  const obMosques = allMosques.filter(
    (m) => m.onboarding_status === "in_progress" || m.onboarding_status === "live"
  );
  const obTotal = obMosques.length;
  const taskCompletionRates: Record<string, { completed: number; total: number }> = {};
  for (const key of TASK_KEYS) {
    let completed = 0;
    for (const m of obMosques) {
      const progress = m.onboarding_progress as Record<string, boolean> | null;
      if (progress?.[key]) completed++;
    }
    taskCompletionRates[key] = { completed, total: obTotal };
  }

  /* alerts */
  const REQUIRED_TASKS = ["mosque_profile", "app_branding", "prayer_times", "jummah_setup", "stripe_connect"];
  const mosquesWithPrayers = new Set((prayerRows ?? []).map((r) => r.mosque_id as string));
  const now = Date.now();
  const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

  type Alert = { severity: "critical" | "warning"; message: string; mosqueId?: string };
  const alerts: Alert[] = [];

  for (const m of allMosques) {
    const progress = (m.onboarding_progress as Record<string, boolean>) ?? {};
    const name = (m.name as string) || "Unnamed mosque";
    const id = m.id as string;

    // Stuck in onboarding > 14 days
    if (m.onboarding_status === "in_progress" && m.created_at) {
      const age = now - new Date(m.created_at as string).getTime();
      if (age > FOURTEEN_DAYS) {
        const days = Math.floor(age / (24 * 60 * 60 * 1000));
        alerts.push({ severity: "warning", message: `${name} has been onboarding for ${days} days`, mosqueId: id });
      }
    }

    // Live but missing critical tasks
    if (m.onboarding_status === "live") {
      const missing = REQUIRED_TASKS.filter((k) => !progress[k]);
      if (missing.length > 0) {
        alerts.push({
          severity: "critical",
          message: `${name} is live but missing: ${missing.join(", ").replace(/_/g, " ")}`,
          mosqueId: id,
        });
      }
    }

    // Has prayer config but no todays_prayers rows (stale/broken sync)
    if ((m.onboarding_status === "live" || m.onboarding_status === "in_progress") && progress.prayer_times && !mosquesWithPrayers.has(id)) {
      alerts.push({ severity: "warning", message: `${name} has prayer config but no today's prayer data — sync may be failing`, mosqueId: id });
    }

    // Stripe connected but no stripe_account_id (shouldn't happen, but catch it)
    if (progress.stripe_connect && !m.stripe_account_id) {
      alerts.push({ severity: "warning", message: `${name} marked Stripe complete but has no Stripe account ID`, mosqueId: id });
    }
  }

  // Sort: critical first, then warning
  alerts.sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1));

  /* prayer system status */
  const activeMosques = allMosques.filter(
    (m) => m.onboarding_status === "live" || m.onboarding_status === "in_progress"
  );
  const mosquesWithPrayerConfig = new Set<string>();
  const iqamahCountByMosque = new Map<string, number>();
  for (const row of iqamahRows ?? []) {
    const id = row.mosque_id as string;
    mosquesWithPrayerConfig.add(id);
    iqamahCountByMosque.set(id, (iqamahCountByMosque.get(id) ?? 0) + 1);
  }
  const mosquesWithCachedMonth = new Set((cachedPrayerRows ?? []).map((r) => r.mosque_id as string));

  // Per-mosque prayer health
  type PrayerMosqueStatus = {
    mosqueId: string;
    name: string;
    hasIqamahConfig: boolean;
    iqamahCount: number;       // should be 5
    hasCachedMonth: boolean;
    hasTodaysPrayers: boolean;
  };
  const prayerStatuses: PrayerMosqueStatus[] = activeMosques.map((m) => {
    const id = m.id as string;
    return {
      mosqueId: id,
      name: (m.name as string) || "Unnamed",
      hasIqamahConfig: mosquesWithPrayerConfig.has(id),
      iqamahCount: iqamahCountByMosque.get(id) ?? 0,
      hasCachedMonth: mosquesWithCachedMonth.has(id),
      hasTodaysPrayers: mosquesWithPrayers.has(id),
    };
  });

  const prayerSystemStats = {
    totalActive: activeMosques.length,
    withIqamahConfig: prayerStatuses.filter((p) => p.hasIqamahConfig).length,
    withIncompleteIqamah: prayerStatuses.filter((p) => p.hasIqamahConfig && p.iqamahCount < 5).length,
    withCachedMonth: prayerStatuses.filter((p) => p.hasCachedMonth).length,
    withTodaysPrayers: prayerStatuses.filter((p) => p.hasTodaysPrayers).length,
    problemMosques: prayerStatuses.filter(
      (p) => p.hasIqamahConfig && (!p.hasCachedMonth || !p.hasTodaysPrayers || p.iqamahCount < 5)
    ),
  };

  /* stripe health */
  const MONTHLY_PRICE = 250;
  const liveMosques = allMosques.filter((m) => m.onboarding_status === "live");
  const mosquesWithStripe = allMosques.filter((m) => m.stripe_account_id);
  const mosquesStripeNoCharges = allMosques.filter(
    (m) => m.stripe_account_id && !(m.onboarding_progress as Record<string, boolean>)?.stripe_connect
  );
  const totalDonations = (donationRows ?? []).reduce((sum, d) => sum + ((d.amountGiven as number) ?? 0), 0);

  const stripeHealthStats = {
    mrr: liveMosques.filter((m) => m.subscription_status === "active").length * MONTHLY_PRICE,
    totalDonations,
    connectedAccounts: mosquesWithStripe.length,
    pendingVerification: mosquesStripeNoCharges.length,
    liveWithoutStripe: liveMosques.filter((m) => !m.stripe_account_id).length,
    canceledSubscriptions: allMosques.filter((m) => m.subscription_status === "canceled").length,
  };

  /* content stats */
  const allSpeakers = speakerRows ?? [];
  const allContent = contentRows ?? [];
  const programs = allContent.filter((c) => c.type === "program");
  const events = allContent.filter((c) => c.type === "event");

  // Mosques with content (among active ones)
  const activeMosqueIds = new Set(activeMosques.map((m) => m.id as string));
  const mosquesWithSpeakers = new Set(allSpeakers.filter((s) => activeMosqueIds.has(s.mosque_id as string)).map((s) => s.mosque_id as string));
  const mosquesWithContent = new Set(allContent.filter((c) => activeMosqueIds.has(c.mosque_id as string)).map((c) => c.mosque_id as string));
  const mosquesWithZeroContent = activeMosques.filter(
    (m) => !mosquesWithSpeakers.has(m.id as string) && !mosquesWithContent.has(m.id as string)
  );

  const contentStats = {
    totalSpeakers: allSpeakers.length,
    totalPrograms: programs.length,
    totalEvents: events.length,
    mosquesWithContent: mosquesWithContent.size,
    mosquesWithSpeakers: mosquesWithSpeakers.size,
    mosquesWithZeroContent: mosquesWithZeroContent.map((m) => ({
      id: m.id as string,
      name: (m.name as string) || "Unnamed",
    })),
    activeMosqueCount: activeMosques.length,
  };

  /* user growth (last 30 days) */
  const allSignups = signupRows ?? [];
  const signupsThisMonth = allSignups.length;
  // group by mosque for per-mosque growth
  const signupsByMosque = new Map<string, number>();
  for (const row of allSignups) {
    const id = row.mosque_id as string;
    if (id) signupsByMosque.set(id, (signupsByMosque.get(id) ?? 0) + 1);
  }
  // top 5 fastest growing mosques
  const topGrowingMosques = [...signupsByMosque.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([mosqueId, count]) => {
      const mosque = allMosques.find((m) => m.id === mosqueId);
      return { mosqueId, name: (mosque?.name as string) || "Unknown", signups: count };
    });

  const userGrowthStats = {
    signupsThisMonth,
    topGrowingMosques,
  };

  /* inactive admin detection */
  const lastAdminLogin = new Map<string, string>();
  for (const row of adminLoginRows ?? []) {
    const id = row.mosque_id as string;
    // only keep the first (most recent) per mosque
    if (id && !lastAdminLogin.has(id)) {
      lastAdminLogin.set(id, row.created_at as string);
    }
  }
  const SEVEN_DAYS = 7 * 86400000;
  const inactiveMosques = activeMosques
    .map((m) => {
      const id = m.id as string;
      const lastLogin = lastAdminLogin.get(id);
      const daysSince = lastLogin
        ? Math.floor((now - new Date(lastLogin).getTime()) / 86400000)
        : null; // null = never logged in
      return {
        mosqueId: id,
        name: (m.name as string) || "Unnamed",
        daysSinceLogin: daysSince,
        neverLoggedIn: daysSince === null,
      };
    })
    .filter((m) => m.neverLoggedIn || (m.daysSinceLogin !== null && m.daysSinceLogin > 7))
    .sort((a, b) => {
      // never logged in first, then by longest absence
      if (a.neverLoggedIn && !b.neverLoggedIn) return -1;
      if (!a.neverLoggedIn && b.neverLoggedIn) return 1;
      return (b.daysSinceLogin ?? Infinity) - (a.daysSinceLogin ?? Infinity);
    });

  /* attention queue — ranked list of mosques needing action */
  type AttentionItem = {
    mosqueId: string;
    name: string;
    reasons: string[];
    severity: "critical" | "warning" | "info";
  };
  const attentionMap = new Map<string, AttentionItem>();

  const getOrCreate = (id: string, name: string): AttentionItem => {
    if (!attentionMap.has(id)) {
      attentionMap.set(id, { mosqueId: id, name, reasons: [], severity: "info" });
    }
    return attentionMap.get(id)!;
  };

  // pull from alerts
  for (const alert of alerts) {
    if (!alert.mosqueId) continue;
    const mosque = allMosques.find((m) => m.id === alert.mosqueId);
    const item = getOrCreate(alert.mosqueId, (mosque?.name as string) || "Unknown");
    item.reasons.push(alert.message.replace(`${item.name} `, "").replace(`${item.name}`, "").trim() || alert.message);
    if (alert.severity === "critical") item.severity = "critical";
    else if (item.severity !== "critical") item.severity = "warning";
  }

  // inactive admins
  for (const m of inactiveMosques) {
    const item = getOrCreate(m.mosqueId, m.name);
    const reason = m.neverLoggedIn ? "Admin never logged in" : `No admin login in ${m.daysSinceLogin}d`;
    item.reasons.push(reason);
    if (item.severity === "info") item.severity = "warning";
  }

  // zero content
  for (const m of mosquesWithZeroContent) {
    const id = m.id as string;
    const name = (m.name as string) || "Unnamed";
    const item = getOrCreate(id, name);
    item.reasons.push("No content (speakers, programs, or events)");
    if (item.severity === "info") item.severity = "info";
  }

  const attentionQueue = [...attentionMap.values()]
    .sort((a, b) => {
      const sev = { critical: 0, warning: 1, info: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return b.reasons.length - a.reasons.length;
    });

  /* builds needing action */
  const buildsNeedingAction = APPS.filter(
    (a) => a.status === "building" || a.status === "pending_review" || a.status === "rejected"
  ).map((a) => ({
    id: a.id,
    name: a.name,
    mosqueName: a.mosqueName,
    status: a.status,
    lastDate: a.versions[0]?.date ?? null,
  }));

  /* recent activity */
  const recentActivity = (activityRows ?? []).map((row) => ({
    action: row.action as string,
    actorName: (row.actor_name as string) ?? "System",
    entityName: (row.entity_name as string) ?? null,
    mosqueName: ((row.metadata as Record<string, unknown>)?.mosque_name as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Overview</h1>
          <p className="mt-1 text-sm text-subtle">
            Platform health, pipeline, and systems at a glance.
          </p>
        </div>
        <p className="text-xs tabular-nums text-faint">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <OverviewClient
        totalMosques={allMosques.length}
        totalUsers={userCount ?? 0}
        onboardingStatusCounts={onboardingStatusCounts}
        pipelineCounts={pipelineCounts}
        subscriptionCounts={subscriptionCounts}
        taskCompletionRates={taskCompletionRates}
        recentActivity={recentActivity}
        alerts={alerts}
        prayerSystemStats={prayerSystemStats}
        stripeHealthStats={stripeHealthStats}
        contentStats={contentStats}
        buildsStats={{
          total: APPS.length,
          live: APPS.filter((a) => a.status === "live").length,
          building: APPS.filter((a) => a.status === "building").length,
          pendingReview: APPS.filter((a) => a.status === "pending_review").length,
          rejected: APPS.filter((a) => a.status === "rejected").length,
          totalReleases: APPS.reduce((sum, a) => sum + a.versions.length, 0),
        }}
        userGrowthStats={userGrowthStats}
        attentionQueue={attentionQueue}
        buildsNeedingAction={buildsNeedingAction}
      />
    </div>
  );
}

