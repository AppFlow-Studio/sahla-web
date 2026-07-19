import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * EAS Update (OTA) sync.
 *
 * Reads each ready/live mosque's recorded `eas_project_id` and pulls its EAS
 * Update history from Expo's GraphQL API into `app_eas_updates`, which the HQ
 * Builds tab renders as OTA update history — distinct from App Store / Play
 * releases.
 *
 * A single `eas update` publish creates one Expo update row per platform, all
 * sharing a `group` id; we collapse them into one row per group with a
 * platforms[] array.
 */

const EXPO_GRAPHQL = "https://api.expo.dev/graphql";

export function getEasConfigStatus(): { configured: boolean } {
  return { configured: Boolean(process.env.EXPO_TOKEN) };
}

export type EasUpdateGroup = {
  updateGroup: string;
  branch: string | null;
  message: string | null;
  runtimeVersion: string | null;
  platforms: string[];
  gitCommit: string | null;
  publishedBy: string | null;
  publishedAt: string | null; // ISO
};

async function expoGraphQL<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const token = process.env.EXPO_TOKEN;
  if (!token) throw new Error("EXPO_TOKEN not configured");
  const res = await fetch(EXPO_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Expo GraphQL ${res.status}${body ? `: ${body.slice(0, 300)}` : ""}`);
  }
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) {
    throw new Error(`Expo GraphQL: ${JSON.stringify(json.errors).slice(0, 300)}`);
  }
  return json.data as T;
}

type ExpoActor = { __typename: string; username?: string; firstName?: string };
type ExpoUpdate = {
  id: string;
  group: string;
  message: string | null;
  runtimeVersion: string | null;
  platform: string;
  createdAt: string;
  gitCommitHash: string | null;
  actor: ExpoActor | null;
};
type ExpoBranch = { name: string; updates: ExpoUpdate[] };
type BranchesResponse = {
  app: { byId: { id: string; updateBranches: ExpoBranch[] } | null } | null;
};

function actorName(actor: ExpoActor | null): string | null {
  if (!actor) return null;
  return actor.username ?? actor.firstName ?? null;
}

/**
 * Fetch recent EAS Update groups for a project, newest first. Reads up to
 * `branchLimit` branches and `updateLimit` updates per branch, then collapses
 * per-platform rows into one group each.
 */
export async function fetchEasUpdates(
  projectId: string,
  branchLimit = 25,
  updateLimit = 50
): Promise<EasUpdateGroup[]> {
  const data = await expoGraphQL<BranchesResponse>(
    `query($id:String!,$b:Int!,$u:Int!){
      app{ byId(appId:$id){
        id
        updateBranches(limit:$b, offset:0){
          name
          updates(limit:$u, offset:0){
            id group message runtimeVersion platform createdAt gitCommitHash
            actor{ __typename ... on User{ username } ... on Robot{ firstName } }
          }
        }
      } }
    }`,
    { id: projectId, b: branchLimit, u: updateLimit }
  );

  const app = data.app?.byId;
  if (!app) throw new Error(`No EAS project found for id ${projectId}`);

  const groups = new Map<string, EasUpdateGroup>();
  for (const branch of app.updateBranches ?? []) {
    for (const u of branch.updates ?? []) {
      const existing = groups.get(u.group);
      if (existing) {
        if (!existing.platforms.includes(u.platform)) existing.platforms.push(u.platform);
        continue;
      }
      groups.set(u.group, {
        updateGroup: u.group,
        branch: branch.name,
        message: u.message,
        runtimeVersion: u.runtimeVersion,
        platforms: [u.platform],
        gitCommit: u.gitCommitHash,
        publishedBy: actorName(u.actor),
        publishedAt: u.createdAt,
      });
    }
  }

  return [...groups.values()].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
}

export type EasSyncSummary = {
  configured: boolean;
  synced: number; // mosques synced
  updates: number; // update-group rows upserted
  skipped: number; // mosques without an eas_project_id
  errors: number;
  message?: string;
};

export async function syncEasUpdates(): Promise<EasSyncSummary> {
  if (!getEasConfigStatus().configured) {
    return {
      configured: false,
      synced: 0,
      updates: 0,
      skipped: 0,
      errors: 0,
      message: "No EXPO_TOKEN configured — set it to enable EAS Update syncing.",
    };
  }

  const supabase = createAdminSupabaseClient();
  const { data: mosques, error } = await supabase
    .from("mosques")
    .select("id, eas_project_id")
    .in("onboarding_status", ["ready", "live"]);

  if (error) {
    return { configured: true, synced: 0, updates: 0, skipped: 0, errors: 1, message: error.message };
  }

  let synced = 0;
  let updates = 0;
  let skipped = 0;
  let errors = 0;

  for (const m of mosques ?? []) {
    if (!m.eas_project_id) {
      skipped++;
      continue;
    }
    try {
      const groups = await fetchEasUpdates(m.eas_project_id);
      if (groups.length > 0) {
        const { error: upsertError } = await supabase.from("app_eas_updates").upsert(
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
        if (upsertError) throw new Error(upsertError.message);
        updates += groups.length;
      }
      synced++;
    } catch {
      errors++;
    }
  }

  return { configured: true, synced, updates, skipped, errors };
}
