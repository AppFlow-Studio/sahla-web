import KanbanBoard from "@/app/components/kanban/KanbanBoard";
import type { KanbanCard, Stage } from "@/app/components/kanban/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function PipelinePage() {
  const supabase = createAdminSupabaseClient();
  const VALID_STAGES = new Set<Stage>([
    "lead",
    "contacted",
    "demo",
    "contract",
    "onboarding",
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

  const latestByMosque = new Map<string, PipelineRow>();
  const fallbackRows: PipelineRow[] = [];

  for (const row of (data ?? []) as PipelineRow[]) {
    const mosque = unwrapMosque(row.mosques);
    const mosqueId = (row.mosque_id ?? mosque?.id ?? "").trim();

    // Keep only the latest stage row per mosque so board reflects current pipeline state.
    if (mosqueId) {
      if (!latestByMosque.has(mosqueId)) {
        latestByMosque.set(mosqueId, row);
      }
      continue;
    }

    // Rows without mosque id cannot be de-duplicated safely; keep them as-is.
    fallbackRows.push(row);
  }

  const dedupedRows = [...latestByMosque.values(), ...fallbackRows];

  const cards: KanbanCard[] = dedupedRows.map((row) => {
    const mosque = unwrapMosque(row.mosques);
    const mosqueId = row.mosque_id ?? mosque?.id ?? "";

    return {
      id: mosqueId || row.id,
      mosqueId,
      mosqueName: (mosque?.name ?? "").trim(),
      city: (mosque?.city ?? "").trim(),
      state: mosque?.state?.trim() ?? null,
      contactName: (row.contact_name ?? "").trim(),
      contactEmail: (row.contact_email ?? "").trim() || null,
      stage: normalizeStage(row.stage),
      onboardingProgress:
        typeof mosque?.onboarding_progress === "number"
          ? mosque.onboarding_progress
          : null,
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
