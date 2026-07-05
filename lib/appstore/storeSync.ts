import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AppStatus } from "@/app/(admin)/builds/data";

/**
 * App store build sync.
 *
 * Reads each ready/live mosque's recorded bundle_id (iOS) / package_name
 * (Android) and pulls current status + version history from the App Store
 * Connect API and Google Play Developer API into `app_builds` /
 * `app_build_versions`, which the HQ Builds tab renders.
 *
 * The store API clients (`fetchIosBuild` / `fetchAndroidBuild`) are the only
 * unimplemented piece — they need live credentials to build and test against,
 * so they throw `StoreNotConfiguredError` until those are wired. The
 * orchestration, cred detection, and DB upsert below are complete and run as
 * soon as the clients return data.
 */

export class StoreNotConfiguredError extends Error {
  constructor(store: "ios" | "android") {
    super(`${store} store credentials not configured`);
    this.name = "StoreNotConfiguredError";
  }
}

export type SyncedVersion = {
  version: string;
  buildNumber?: string;
  releasedAt?: string; // ISO
  notes?: string;
  storeState?: string;
};

export type BuildSyncResult = {
  status: AppStatus;
  currentVersion?: string;
  currentBuildNumber?: string;
  storeAppId?: string;
  // TestFlight (iOS beta) — independent of `status`.
  onTestflight?: boolean;
  testflightVersion?: string;
  testflightBuildNumber?: string;
  testflightState?: string;
  versions: SyncedVersion[];
};

export function getStoreConfigStatus(): { ios: boolean; android: boolean } {
  return {
    ios: Boolean(
      process.env.APPSTORE_CONNECT_ISSUER_ID &&
        process.env.APPSTORE_CONNECT_KEY_ID &&
        process.env.APPSTORE_CONNECT_PRIVATE_KEY
    ),
    android: Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON),
  };
}

// ─── Store clients (implement when credentials are available) ───

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchIosBuild(bundleId: string): Promise<BuildSyncResult> {
  if (!getStoreConfigStatus().ios) throw new StoreNotConfiguredError("ios");
  // TODO(store-sync): implement against the App Store Connect API.
  //   1. Build a JWT (ES256) from APPSTORE_CONNECT_{ISSUER_ID,KEY_ID,PRIVATE_KEY}.
  //   2. GET /v1/apps?filter[bundleId]=<bundleId> → app id.
  //   3. GET /v1/apps/{id}/appStoreVersions (include appStoreVersionLocalizations
  //      for "whatsNew") and /v1/builds for build numbers.
  //   4. Map appStoreState → AppStatus (READY_FOR_SALE→live, WAITING_FOR_REVIEW/
  //      IN_REVIEW→pending_review, PROCESSING/uploading→building, REJECTED→rejected).
  //   5. TestFlight: GET /v1/builds?filter[app]=<id> + buildBetaDetails
  //      (externalBuildState). Set onTestflight when a build is in external
  //      beta (IN_BETA_TESTING/IN_BETA_REVIEW) and fill testflightVersion/
  //      testflightBuildNumber/testflightState. Independent of appStoreState.
  throw new Error("App Store Connect client not implemented");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchAndroidBuild(packageName: string): Promise<BuildSyncResult> {
  if (!getStoreConfigStatus().android) throw new StoreNotConfiguredError("android");
  // TODO(store-sync): implement against the Google Play Developer API.
  //   1. OAuth2 with GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (androidpublisher scope).
  //   2. edits.insert → edits.tracks.list to read production/beta releases
  //      (versionName, versionCodes, status, releaseNotes) → edits.delete.
  //   3. Map status: completed→live, inProgress→building, draft→pending_review,
  //      halted→rejected. History accumulates across syncs (Play gives current state).
  throw new Error("Google Play client not implemented");
}

// ─── DB upsert ───

async function upsertBuild(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  mosqueId: string,
  platform: "ios" | "android",
  result: BuildSyncResult
) {
  const nowIso = new Date().toISOString();
  const { data: build, error } = await supabase
    .from("app_builds")
    .upsert(
      {
        mosque_id: mosqueId,
        platform,
        store_app_id: result.storeAppId ?? null,
        status: result.status,
        current_version: result.currentVersion ?? null,
        current_build_number: result.currentBuildNumber ?? null,
        on_testflight: result.onTestflight ?? false,
        testflight_version: result.testflightVersion ?? null,
        testflight_build_number: result.testflightBuildNumber ?? null,
        testflight_state: result.testflightState ?? null,
        last_synced_at: nowIso,
        sync_error: null,
        updated_at: nowIso,
      },
      { onConflict: "mosque_id,platform" }
    )
    .select("id")
    .single();

  if (error || !build) throw new Error(error?.message ?? "upsert app_builds failed");

  if (result.versions.length > 0) {
    await supabase.from("app_build_versions").upsert(
      result.versions.map((v) => ({
        app_build_id: build.id,
        version: v.version,
        build_number: v.buildNumber ?? null,
        released_at: v.releasedAt ?? null,
        notes: v.notes ?? null,
        store_state: v.storeState ?? null,
      })),
      { onConflict: "app_build_id,version", ignoreDuplicates: false }
    );
  }
}

async function recordSyncError(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  mosqueId: string,
  platform: "ios" | "android",
  message: string
) {
  await supabase.from("app_builds").upsert(
    {
      mosque_id: mosqueId,
      platform,
      last_synced_at: new Date().toISOString(),
      sync_error: message,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "mosque_id,platform" }
  );
}

export type SyncSummary = {
  configured: boolean;
  synced: number;
  skipped: number;
  errors: number;
  message?: string;
};

export async function syncAppBuilds(): Promise<SyncSummary> {
  const cfg = getStoreConfigStatus();
  if (!cfg.ios && !cfg.android) {
    return {
      configured: false,
      synced: 0,
      skipped: 0,
      errors: 0,
      message:
        "No store credentials configured — set App Store Connect and/or Google Play env vars to enable syncing.",
    };
  }

  const supabase = createAdminSupabaseClient();
  const { data: mosques, error } = await supabase
    .from("mosques")
    .select("id, bundle_id, package_name")
    .in("onboarding_status", ["ready", "live"]);

  if (error) {
    return { configured: true, synced: 0, skipped: 0, errors: 1, message: error.message };
  }

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const m of mosques ?? []) {
    const targets: Array<{ platform: "ios" | "android"; id: string | null; enabled: boolean }> = [
      { platform: "ios", id: m.bundle_id, enabled: cfg.ios },
      { platform: "android", id: m.package_name, enabled: cfg.android },
    ];

    for (const t of targets) {
      if (!t.enabled || !t.id) {
        skipped++;
        continue;
      }
      try {
        const result =
          t.platform === "ios"
            ? await fetchIosBuild(t.id)
            : await fetchAndroidBuild(t.id);
        await upsertBuild(supabase, m.id, t.platform, result);
        synced++;
      } catch (err) {
        errors++;
        const message = err instanceof Error ? err.message : "Unknown sync error";
        await recordSyncError(supabase, m.id, t.platform, message);
      }
    }
  }

  return { configured: true, synced, skipped, errors };
}
