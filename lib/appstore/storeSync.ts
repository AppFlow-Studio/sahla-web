import { createPrivateKey, sign as cryptoSign } from "node:crypto";
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

// ─── App Store Connect client ───

const ASC_BASE = "https://api.appstoreconnect.apple.com";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/**
 * The private key is stored in `APPSTORE_CONNECT_PRIVATE_KEY` either as the raw
 * `.p8` PEM or (preferred, to survive single-line env vars) base64-encoded.
 * Detect which and return the PEM.
 */
function getPrivateKeyPem(): string {
  const raw = (process.env.APPSTORE_CONNECT_PRIVATE_KEY ?? "").trim();
  if (raw.includes("BEGIN PRIVATE KEY")) return raw.replace(/\\n/g, "\n");
  return Buffer.from(raw, "base64").toString("utf8");
}

/** Short-lived ES256 JWT for the App Store Connect API (max lifetime 20 min). */
function makeAppStoreToken(): string {
  const keyId = process.env.APPSTORE_CONNECT_KEY_ID;
  const issuerId = process.env.APPSTORE_CONNECT_ISSUER_ID;
  if (!keyId || !issuerId) throw new StoreNotConfiguredError("ios");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 60 * 15,
    aud: "appstoreconnect-v1",
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload)
  )}`;
  const key = createPrivateKey(getPrivateKeyPem());
  const signature = cryptoSign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363", // JOSE requires raw R||S, not DER
  });
  return `${signingInput}.${base64url(signature)}`;
}

async function ascGet<T = unknown>(path: string, token: string): Promise<T> {
  const res = await fetch(`${ASC_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `App Store Connect ${res.status} on ${path}${body ? `: ${body.slice(0, 300)}` : ""}`
    );
  }
  return res.json() as Promise<T>;
}

/** appStoreState → our coarse AppStatus. */
function mapAppStoreState(state: string | undefined): AppStatus {
  switch (state) {
    case "READY_FOR_SALE":
    case "PREORDER_READY_FOR_SALE":
    case "REPLACED_WITH_NEW_VERSION":
      return "live";
    case "WAITING_FOR_REVIEW":
    case "IN_REVIEW":
    case "WAITING_FOR_EXPORT_COMPLIANCE":
    case "PENDING_APPLE_RELEASE":
    case "PENDING_DEVELOPER_RELEASE":
    case "PENDING_CONTRACT":
    case "ACCEPTED":
      return "pending_review";
    case "PREPARE_FOR_SUBMISSION":
    case "PROCESSING_FOR_APP_STORE":
    case "INVALID_BINARY":
      return "building";
    case "REJECTED":
    case "DEVELOPER_REJECTED":
    case "METADATA_REJECTED":
      return "rejected";
    default:
      return "unknown";
  }
}

const TESTFLIGHT_ACTIVE_STATES = new Set([
  "IN_BETA_TESTING",
  "IN_BETA_REVIEW",
  "BETA_APPROVED",
  "READY_FOR_BETA_TESTING",
]);

type AscResource = {
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string; type: string } | null }>;
};
type AscList = { data?: AscResource[]; included?: AscResource[] };

async function fetchIosBuild(bundleId: string): Promise<BuildSyncResult> {
  if (!getStoreConfigStatus().ios) throw new StoreNotConfiguredError("ios");
  const token = makeAppStoreToken();

  // 1. Resolve the app by bundle id.
  const apps = await ascGet<AscList>(
    `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&limit=1`,
    token
  );
  const appId = apps.data?.[0]?.id;
  if (!appId) {
    throw new Error(`No App Store Connect app found for bundle id ${bundleId}`);
  }

  // 2. App Store versions (with their build) for iOS.
  const versionsRes = await ascGet<AscList>(
    `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=10&include=build` +
      `&fields[appStoreVersions]=versionString,appStoreState,createdDate,build` +
      `&fields[builds]=version`,
    token
  );
  const buildVersionById = new Map<string, string>();
  for (const inc of versionsRes.included ?? []) {
    const v = inc.attributes?.version;
    if (typeof v === "string") buildVersionById.set(inc.id, v);
  }

  const versions: SyncedVersion[] = (versionsRes.data ?? []).map((v) => {
    const buildRelId = v.relationships?.build?.data?.id;
    return {
      version: String(v.attributes?.versionString ?? ""),
      buildNumber: buildRelId ? buildVersionById.get(buildRelId) : undefined,
      releasedAt:
        typeof v.attributes?.createdDate === "string"
          ? v.attributes.createdDate
          : undefined,
      storeState:
        typeof v.attributes?.appStoreState === "string"
          ? v.attributes.appStoreState
          : undefined,
    };
  });

  // "Current" = the live version if one exists, else the newest returned.
  const liveVersion = versionsRes.data?.find(
    (v) => mapAppStoreState(v.attributes?.appStoreState as string) === "live"
  );
  const current = liveVersion ?? versionsRes.data?.[0];
  const currentBuildRelId = current?.relationships?.build?.data?.id;

  // 3. TestFlight — most recent builds + their external beta state.
  let onTestflight = false;
  let testflightVersion: string | undefined;
  let testflightBuildNumber: string | undefined;
  let testflightState: string | undefined;
  try {
    const builds = await ascGet<AscList>(
      `/v1/builds?filter[app]=${appId}&sort=-uploadedDate&limit=10` +
        `&include=buildBetaDetail,preReleaseVersion` +
        `&fields[builds]=version,uploadedDate,buildBetaDetail,preReleaseVersion` +
        `&fields[buildBetaDetails]=externalBuildState,internalBuildState` +
        `&fields[preReleaseVersions]=version`,
      token
    );
    const betaById = new Map<string, Record<string, unknown>>();
    const preReleaseById = new Map<string, string>();
    for (const inc of builds.included ?? []) {
      if (inc.attributes?.externalBuildState || inc.attributes?.internalBuildState) {
        betaById.set(inc.id, inc.attributes);
      }
      if (typeof inc.attributes?.version === "string" && !inc.attributes?.externalBuildState) {
        preReleaseById.set(inc.id, inc.attributes.version);
      }
    }
    const activeBuild = (builds.data ?? []).find((b) => {
      const betaId = b.relationships?.buildBetaDetail?.data?.id;
      const beta = betaId ? betaById.get(betaId) : undefined;
      const ext = beta?.externalBuildState as string | undefined;
      const int = beta?.internalBuildState as string | undefined;
      return (
        (ext && TESTFLIGHT_ACTIVE_STATES.has(ext)) || int === "IN_BETA_TESTING"
      );
    });
    if (activeBuild) {
      onTestflight = true;
      testflightBuildNumber = String(activeBuild.attributes?.version ?? "");
      const preId = activeBuild.relationships?.preReleaseVersion?.data?.id;
      testflightVersion = preId ? preReleaseById.get(preId) : undefined;
      const betaId = activeBuild.relationships?.buildBetaDetail?.data?.id;
      const beta = betaId ? betaById.get(betaId) : undefined;
      const ext = beta?.externalBuildState as string | undefined;
      const int = beta?.internalBuildState as string | undefined;
      // Report whichever state actually made the build active (external beta
      // takes precedence, else fall back to the internal testing state).
      testflightState =
        ext && TESTFLIGHT_ACTIVE_STATES.has(ext) ? ext : int ?? ext ?? undefined;
    }
  } catch {
    // TestFlight is best-effort; a failure here shouldn't fail the whole sync.
  }

  return {
    status: mapAppStoreState(current?.attributes?.appStoreState as string),
    currentVersion: current
      ? String(current.attributes?.versionString ?? "")
      : undefined,
    currentBuildNumber: currentBuildRelId
      ? buildVersionById.get(currentBuildRelId)
      : undefined,
    storeAppId: appId,
    onTestflight,
    testflightVersion,
    testflightBuildNumber,
    testflightState,
    versions,
  };
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
