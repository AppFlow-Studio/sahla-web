import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Scheduled app-build + EAS-update sync.
 *
 * Deno port of lib/appstore/storeSync.ts + lib/eas/easSync.ts. Runs from a
 * pg_cron job (net.http_post, no Authorization header — verify_jwt = false).
 * Pulls each ready/live mosque's App Store Connect status/versions/TestFlight
 * (iOS) and EAS Update OTA history, and upserts into app_builds /
 * app_build_versions / app_eas_updates, which the HQ Builds tab renders.
 *
 * Env (set via `supabase secrets set`):
 *   APPSTORE_CONNECT_KEY_ID, APPSTORE_CONNECT_ISSUER_ID,
 *   APPSTORE_CONNECT_PRIVATE_KEY (base64 of the .p8 PEM, or raw PEM), EXPO_TOKEN.
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
 */

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

type AppStatus = "live" | "pending_review" | "building" | "rejected" | "unknown";

// ─── shared helpers ───

function b64url(input: string | ArrayBuffer): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function storeConfig() {
  return {
    ios: Boolean(
      Deno.env.get("APPSTORE_CONNECT_ISSUER_ID") &&
        Deno.env.get("APPSTORE_CONNECT_KEY_ID") &&
        Deno.env.get("APPSTORE_CONNECT_PRIVATE_KEY")
    ),
  };
}
function easConfigured() {
  return Boolean(Deno.env.get("EXPO_TOKEN"));
}

// ─── App Store Connect ───

/** The private key env is base64 of the .p8 PEM (preferred) or the raw PEM. */
function getPemText(): string {
  const raw = (Deno.env.get("APPSTORE_CONNECT_PRIVATE_KEY") ?? "").trim();
  if (raw.includes("BEGIN PRIVATE KEY")) return raw.replace(/\\n/g, "\n");
  return atob(raw);
}

function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(body);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der;
}

async function makeAppStoreToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: Deno.env.get("APPSTORE_CONNECT_KEY_ID"), typ: "JWT" };
  const payload = {
    iss: Deno.env.get("APPSTORE_CONNECT_ISSUER_ID"),
    iat: now,
    exp: now + 60 * 15,
    aud: "appstoreconnect-v1",
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(getPemText()),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  // Web Crypto ECDSA sign returns raw R||S (IEEE P1363) — exactly what JOSE wants.
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${b64url(sig)}`;
}

const ASC_BASE = "https://api.appstoreconnect.apple.com";

// deno-lint-ignore no-explicit-any
async function ascGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${ASC_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`App Store Connect ${res.status} on ${path}${body ? `: ${body.slice(0, 300)}` : ""}`);
  }
  return res.json();
}

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

const TESTFLIGHT_ACTIVE = new Set([
  "IN_BETA_TESTING",
  "IN_BETA_REVIEW",
  "BETA_APPROVED",
  "READY_FOR_BETA_TESTING",
]);

type SyncedVersion = {
  version: string;
  buildNumber?: string;
  releasedAt?: string;
  storeState?: string;
};

async function fetchIosBuild(bundleId: string, token: string) {
  const apps = await ascGet(`/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&limit=1`, token);
  const appId = apps.data?.[0]?.id;
  if (!appId) throw new Error(`No App Store Connect app found for bundle id ${bundleId}`);

  const versionsRes = await ascGet(
    `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=10&include=build` +
      `&fields[appStoreVersions]=versionString,appStoreState,createdDate,build&fields[builds]=version`,
    token
  );
  const buildVersionById = new Map<string, string>();
  for (const inc of versionsRes.included ?? []) {
    if (typeof inc.attributes?.version === "string") buildVersionById.set(inc.id, inc.attributes.version);
  }
  // deno-lint-ignore no-explicit-any
  const versions: SyncedVersion[] = (versionsRes.data ?? []).map((v: any) => {
    const buildRelId = v.relationships?.build?.data?.id;
    return {
      version: String(v.attributes?.versionString ?? ""),
      buildNumber: buildRelId ? buildVersionById.get(buildRelId) : undefined,
      releasedAt: typeof v.attributes?.createdDate === "string" ? v.attributes.createdDate : undefined,
      storeState: typeof v.attributes?.appStoreState === "string" ? v.attributes.appStoreState : undefined,
    };
  });

  // deno-lint-ignore no-explicit-any
  const liveVersion = versionsRes.data?.find(
    (v: any) => mapAppStoreState(v.attributes?.appStoreState) === "live"
  );
  const current = liveVersion ?? versionsRes.data?.[0];
  const currentBuildRelId = current?.relationships?.build?.data?.id;

  let onTestflight = false;
  let testflightVersion: string | undefined;
  let testflightBuildNumber: string | undefined;
  let testflightState: string | undefined;
  try {
    const builds = await ascGet(
      `/v1/builds?filter[app]=${appId}&sort=-uploadedDate&limit=10` +
        `&include=buildBetaDetail,preReleaseVersion` +
        `&fields[builds]=version,uploadedDate,buildBetaDetail,preReleaseVersion` +
        `&fields[buildBetaDetails]=externalBuildState,internalBuildState` +
        `&fields[preReleaseVersions]=version`,
      token
    );
    // deno-lint-ignore no-explicit-any
    const betaById = new Map<string, any>();
    const preReleaseById = new Map<string, string>();
    for (const inc of builds.included ?? []) {
      if (inc.attributes?.externalBuildState || inc.attributes?.internalBuildState) betaById.set(inc.id, inc.attributes);
      if (typeof inc.attributes?.version === "string" && !inc.attributes?.externalBuildState)
        preReleaseById.set(inc.id, inc.attributes.version);
    }
    // deno-lint-ignore no-explicit-any
    const activeBuild = (builds.data ?? []).find((b: any) => {
      const beta = betaById.get(b.relationships?.buildBetaDetail?.data?.id);
      const ext = beta?.externalBuildState;
      const int = beta?.internalBuildState;
      return (ext && TESTFLIGHT_ACTIVE.has(ext)) || int === "IN_BETA_TESTING";
    });
    if (activeBuild) {
      onTestflight = true;
      testflightBuildNumber = String(activeBuild.attributes?.version ?? "");
      const preId = activeBuild.relationships?.preReleaseVersion?.data?.id;
      testflightVersion = preId ? preReleaseById.get(preId) : undefined;
      const beta = betaById.get(activeBuild.relationships?.buildBetaDetail?.data?.id);
      const ext = beta?.externalBuildState;
      const int = beta?.internalBuildState;
      testflightState = ext && TESTFLIGHT_ACTIVE.has(ext) ? ext : int ?? ext ?? undefined;
    }
  } catch (_) {
    // TestFlight best-effort.
  }

  return {
    status: mapAppStoreState(current?.attributes?.appStoreState),
    currentVersion: current ? String(current.attributes?.versionString ?? "") : undefined,
    currentBuildNumber: currentBuildRelId ? buildVersionById.get(currentBuildRelId) : undefined,
    storeAppId: appId,
    onTestflight,
    testflightVersion,
    testflightBuildNumber,
    testflightState,
    versions,
  };
}

// deno-lint-ignore no-explicit-any
async function upsertBuild(mosqueId: string, result: any) {
  const nowIso = new Date().toISOString();
  const { data: build, error } = await supabase
    .from("app_builds")
    .upsert(
      {
        mosque_id: mosqueId,
        platform: "ios",
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
      // deno-lint-ignore no-explicit-any
      result.versions.map((v: any) => ({
        app_build_id: build.id,
        version: v.version,
        build_number: v.buildNumber ?? null,
        released_at: v.releasedAt ?? null,
        notes: null,
        store_state: v.storeState ?? null,
      })),
      { onConflict: "app_build_id,version" }
    );
  }
}

async function recordSyncError(mosqueId: string, message: string) {
  const nowIso = new Date().toISOString();
  await supabase
    .from("app_builds")
    .upsert(
      { mosque_id: mosqueId, platform: "ios", last_synced_at: nowIso, sync_error: message, updated_at: nowIso },
      { onConflict: "mosque_id,platform" }
    );
}

// ─── EAS Update ───

async function fetchEasUpdates(projectId: string) {
  const res = await fetch("https://api.expo.dev/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("EXPO_TOKEN")}`,
    },
    body: JSON.stringify({
      query: `query($id:String!,$b:Int!,$u:Int!){
        app{ byId(appId:$id){ id updateBranches(limit:$b,offset:0){
          name updates(limit:$u,offset:0){
            id group message runtimeVersion platform createdAt gitCommitHash
            actor{ __typename ... on User{ username } ... on Robot{ firstName } }
          } } } }
      }`,
      variables: { id: projectId, b: 25, u: 50 },
    }),
  });
  if (!res.ok) throw new Error(`Expo GraphQL ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  if (json.errors) throw new Error(`Expo GraphQL: ${JSON.stringify(json.errors).slice(0, 300)}`);

  const app = json.data?.app?.byId;
  if (!app) throw new Error(`No EAS project found for id ${projectId}`);

  // deno-lint-ignore no-explicit-any
  const groups = new Map<string, any>();
  for (const branch of app.updateBranches ?? []) {
    for (const u of branch.updates ?? []) {
      const g = groups.get(u.group);
      if (g) {
        if (!g.platforms.includes(u.platform)) g.platforms.push(u.platform);
        continue;
      }
      groups.set(u.group, {
        updateGroup: u.group,
        branch: branch.name,
        message: u.message,
        runtimeVersion: u.runtimeVersion,
        platforms: [u.platform],
        gitCommit: u.gitCommitHash,
        publishedBy: u.actor?.username ?? u.actor?.firstName ?? null,
        publishedAt: u.createdAt,
      });
    }
  }
  return [...groups.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// ─── main ───

Deno.serve(async () => {
  const cfg = storeConfig();
  const eas = easConfigured();

  const summary = {
    builds: { configured: cfg.ios, synced: 0, skipped: 0, errors: 0 },
    eas: { configured: eas, synced: 0, updates: 0, skipped: 0, errors: 0 },
  };

  if (!cfg.ios && !eas) {
    return Response.json({ ...summary, message: "No App Store Connect or EXPO_TOKEN credentials configured." });
  }

  const { data: mosques, error } = await supabase
    .from("mosques")
    .select("id, bundle_id, eas_project_id")
    .in("onboarding_status", ["ready", "live"]);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const token = cfg.ios ? await makeAppStoreToken() : null;

  for (const m of mosques ?? []) {
    // iOS store build
    if (cfg.ios && token) {
      if (!m.bundle_id) {
        summary.builds.skipped++;
      } else {
        try {
          const result = await fetchIosBuild(m.bundle_id, token);
          await upsertBuild(m.id, result);
          summary.builds.synced++;
        } catch (err) {
          summary.builds.errors++;
          await recordSyncError(m.id, err instanceof Error ? err.message : "sync error");
        }
      }
    }

    // EAS OTA updates
    if (eas) {
      if (!m.eas_project_id) {
        summary.eas.skipped++;
      } else {
        try {
          const groups = await fetchEasUpdates(m.eas_project_id);
          if (groups.length > 0) {
            const { error: upErr } = await supabase.from("app_eas_updates").upsert(
              groups.map((g) => ({
                mosque_id: m.id,
                update_group: g.updateGroup,
                branch: g.branch,
                message: g.message,
                runtime_version: g.runtimeVersion,
                platforms: g.platforms,
                git_commit: g.gitCommit,
                published_by: g.publishedBy,
                published_at: g.publishedAt,
              })),
              { onConflict: "mosque_id,update_group" }
            );
            if (upErr) throw new Error(upErr.message);
            summary.eas.updates += groups.length;
          }
          summary.eas.synced++;
        } catch (_) {
          summary.eas.errors++;
        }
      }
    }
  }

  return Response.json(summary);
});
