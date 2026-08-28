import KanbanBoard from "@/app/components/kanban/KanbanBoard";
import type { KanbanCard, Stage, StoreBuild } from "@/app/components/kanban/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = createAdminSupabaseClient();
  const VALID_STAGES = new Set<Stage>([
    "lead",
    "contacted",
    "demo",
    "contract",
    "onboarding",
    "building",
    "live",
  ]);
  const normalizeStage = (stage: string | null | undefined): Stage => {
    const s = (stage ?? "lead").toLowerCase();
    return VALID_STAGES.has(s as Stage) ? (s as Stage) : "lead";
  };
  type MosqueEmbed = {
    id: string | null;
    name: string | null;
    city: string | null;
    state: string | null;
    onboarding_progress: number | null | Record<string, unknown>;
  };
  type PipelineRow = {
    id: string;
    mosque_id: string | null;
    mosque_name: string | null;
    city: string | null;
    country: string | null;
    stage: string | null;
    contact_name: string | null;
    contact_email: string | null;
    updated_at: string | null;
    mosques: MosqueEmbed | MosqueEmbed[] | null;
  };

  function unwrapMosque(m: PipelineRow["mosques"]): MosqueEmbed | null {
    if (!m) return null;
    return Array.isArray(m) ? (m[0] ?? null) : m;
  }

  const { data, error: pipelineError } = await supabase
    .from("pipeline_stages")
    .select(
      `
    id,
    mosque_id,
    mosque_name,
    city,
    country,
    stage,
    contact_name,
    contact_email,
    updated_at,
    mosques (
      id,
      name,
      city,
      state,
      onboarding_progress
    )
  `
    )
    .order("updated_at", { ascending: false });

  if (pipelineError) {
    return (
      <div>
        <h1 className="font-display text-3xl text-[#0A261E]">Pipeline</h1>
        <p className="mt-4 rounded-xl border border-[rgba(10,38,30,0.12)] bg-white p-4 text-sm text-[#0A261E]/75">
          Could not load pipeline data: {pipelineError.message}
        </p>
      </div>
    );
  }

  const latestByKey = new Map<string, PipelineRow>();

  for (const row of (data ?? []) as PipelineRow[]) {
    const mosque = unwrapMosque(row.mosques);
    // Use mosque_id when linked, otherwise use the pipeline row's own id
    const dedupKey = (row.mosque_id ?? mosque?.id ?? row.id ?? "").trim();

    // Keep only the latest stage row per key so board reflects current pipeline state.
    if (dedupKey && !latestByKey.has(dedupKey)) {
      latestByKey.set(dedupKey, row);
    }
  }

  const dedupedRows = [...latestByKey.values()];

  // Building cards show where each app actually is in the stores, so pull the
  // build rows for the mosques sitting in that column.
  const buildingMosqueIds = dedupedRows
    .filter((row) => normalizeStage(row.stage) === "building")
    .map((row) => row.mosque_id ?? unwrapMosque(row.mosques)?.id)
    .filter((id): id is string => !!id);

  const buildsByMosque = new Map<string, StoreBuild[]>();
  if (buildingMosqueIds.length > 0) {
    const { data: buildRows } = await supabase
      .from("app_builds")
      .select("mosque_id, platform, status, current_version, on_testflight")
      .in("mosque_id", buildingMosqueIds);

    for (const b of (buildRows ?? []) as {
      mosque_id: string;
      platform: string;
      status: string | null;
      current_version: string | null;
      on_testflight: boolean | null;
    }[]) {
      const list = buildsByMosque.get(b.mosque_id) ?? [];
      list.push({
        platform: b.platform,
        status: b.status,
        version: b.current_version,
        onTestflight: b.on_testflight,
      });
      buildsByMosque.set(b.mosque_id, list);
    }
  }

  const cards: KanbanCard[] = dedupedRows.map((row) => {
    const mosque = unwrapMosque(row.mosques);
    const mosqueId = row.mosque_id ?? mosque?.id ?? "";

    return {
      id: row.id,
      mosqueId: mosqueId || row.id,
      mosqueName: (row.mosque_name ?? mosque?.name ?? "").trim(),
      city: (row.city ?? mosque?.city ?? "").trim(),
      state: mosque?.state?.trim() ?? null,
      contactName: (row.contact_name ?? "").trim(),
      contactEmail: (row.contact_email ?? "").trim() || null,
      stage: normalizeStage(row.stage),
      onboardingProgress:
        typeof mosque?.onboarding_progress === "number"
          ? mosque.onboarding_progress
          : null,
      builds: mosqueId ? buildsByMosque.get(mosqueId) ?? null : null,
      updatedAt: row.updated_at ?? new Date(0).toISOString(),
    };
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-[#0A261E]">Pipeline</h1>
      <p className="mt-1 text-sm text-[#0A261E]/60">
        Mosque onboarding pipeline. Track leads and progress here.
      </p>
      <div className="mt-6">
        <KanbanBoard cards={cards} />
      </div>
    </div>
  );
}
