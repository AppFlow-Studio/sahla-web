import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AppVersion = {
  version: string;
  buildNumber?: string;
  date: string | null;
  notes: string;
};

export type AppStatus = "live" | "pending_review" | "building" | "rejected" | "unknown";

/** An EAS Update (OTA) group — one publish, collapsed across platforms. */
export type EasUpdate = {
  group: string;
  branch: string | null;
  message: string;
  runtimeVersion: string | null;
  platforms: ("ios" | "android")[];
  gitCommit: string | null;
  publishedBy: string | null;
  date: string | null;
};

export type AppBuild = {
  id: string;
  name: string;
  mosqueName: string;
  icon: string | null;
  platform: "ios" | "android";
  currentVersion: string | null;
  status: AppStatus;
  bundleId?: string;
  /** True when there's no synced store data yet (identity/status only). */
  awaitingSync: boolean;
  /** iOS TestFlight beta — separate channel from the App Store `status`. */
  onTestflight: boolean;
  testflightVersion: string | null;
  testflightBuildNumber: string | null;
  versions: AppVersion[];
  /** EAS Update (OTA) history, newest first. Empty when no EAS project linked. */
  easUpdates: EasUpdate[];
};

type BuildVersionRow = {
  version: string;
  build_number: string | null;
  released_at: string | null;
  notes: string | null;
};

type BuildRow = {
  platform: "ios" | "android";
  status: AppStatus;
  current_version: string | null;
  current_build_number: string | null;
  on_testflight: boolean | null;
  testflight_version: string | null;
  testflight_build_number: string | null;
  app_build_versions: BuildVersionRow[] | null;
};

type EasUpdateRow = {
  update_group: string;
  branch: string | null;
  message: string | null;
  runtime_version: string | null;
  platforms: string[] | null;
  git_commit: string | null;
  published_by: string | null;
  published_at: string | null;
};

type MosqueRow = {
  id: string;
  name: string | null;
  app_name: string | null;
  logo_url: string | null;
  bundle_id: string | null;
  package_name: string | null;
  onboarding_status: string | null;
  launched_at: string | null;
  created_at: string | null;
  app_builds: BuildRow[] | null;
  app_eas_updates: EasUpdateRow[] | null;
};

// Most-advanced-wins when a mosque has both iOS and Android build rows.
const STATUS_RANK: AppStatus[] = ["rejected", "unknown", "building", "pending_review", "live"];

function pickStatus(builds: BuildRow[], onboardingStatus: string | null): AppStatus {
  if (builds.length > 0) {
    return builds.reduce<AppStatus>(
      (best, b) =>
        STATUS_RANK.indexOf(b.status) > STATUS_RANK.indexOf(best) ? b.status : best,
      "unknown"
    );
  }
  // No synced store data — derive from the onboarding lifecycle.
  // "live" = launched on the store; "ready" = paid, build queued.
  return onboardingStatus === "live" ? "live" : "building";
}

/**
 * Real apps for the HQ Builds tab: every mosque past payment (ready or live),
 * enriched with any synced store build/version data. When the store sync hasn't
 * run (no credentials, or app IDs not yet recorded), a mosque still shows with
 * its identity and an onboarding-derived status, and an empty release history.
 */
export async function fetchAppBuilds(): Promise<AppBuild[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("mosques")
    .select(
      `
      id, name, app_name, logo_url, bundle_id, package_name,
      onboarding_status, launched_at, created_at,
      app_builds (
        platform, status, current_version, current_build_number,
        on_testflight, testflight_version, testflight_build_number,
        app_build_versions ( version, build_number, released_at, notes )
      ),
      app_eas_updates (
        update_group, branch, message, runtime_version,
        platforms, git_commit, published_by, published_at
      )
    `
    )
    .in("onboarding_status", ["ready", "live"])
    .order("launched_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[builds] fetchAppBuilds failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as MosqueRow[];

  return rows.map((m): AppBuild => {
    const builds = m.app_builds ?? [];

    // Flatten synced version history across platforms, newest first.
    const versions: AppVersion[] = builds
      .flatMap((b) => b.app_build_versions ?? [])
      .map((v) => ({
        version: v.version,
        buildNumber: v.build_number ?? undefined,
        date: v.released_at,
        notes: v.notes ?? "",
      }))
      .sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      });

    // EAS Update (OTA) history, newest first.
    const easUpdates: EasUpdate[] = (m.app_eas_updates ?? [])
      .map((u) => ({
        group: u.update_group,
        branch: u.branch,
        message: u.message ?? "",
        runtimeVersion: u.runtime_version,
        platforms: (u.platforms ?? []).filter(
          (p): p is "ios" | "android" => p === "ios" || p === "android"
        ),
        gitCommit: u.git_commit,
        publishedBy: u.published_by,
        date: u.published_at,
      }))
      .sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      });

    const primaryBuild = builds[0];
    const iosBuild = builds.find((b) => b.platform === "ios");
    const platform: "ios" | "android" = m.bundle_id
      ? "ios"
      : m.package_name
      ? "android"
      : primaryBuild?.platform ?? "ios";

    return {
      id: m.id,
      name: m.app_name || m.name || "Untitled app",
      mosqueName: m.name || "—",
      icon: m.logo_url,
      platform,
      currentVersion: primaryBuild?.current_version ?? versions[0]?.version ?? null,
      status: pickStatus(builds, m.onboarding_status),
      bundleId: m.bundle_id || m.package_name || undefined,
      awaitingSync: builds.length === 0,
      onTestflight: iosBuild?.on_testflight ?? false,
      testflightVersion: iosBuild?.testflight_version ?? null,
      testflightBuildNumber: iosBuild?.testflight_build_number ?? null,
      versions,
      easUpdates,
    };
  });
}
