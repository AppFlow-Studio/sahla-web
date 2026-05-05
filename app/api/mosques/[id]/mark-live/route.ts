/**
 * Sahla-team action: flip a "ready" mosque to "live" once the app binary
 * has been built and submitted to the stores.
 *
 * Authorization: any signed-in user whose active Clerk org is the Sahla HQ
 * org. The HQ orgId is checked via NEXT_PUBLIC_SAHLA_ORG_ID — same pattern
 * used by proxy.ts when routing admin paths.
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!SAHLA_HQ_ORG_ID || session.orgId !== SAHLA_HQ_ORG_ID) {
    return NextResponse.json(
      { error: "Forbidden — Sahla HQ membership required" },
      { status: 403 }
    );
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();

  // Only flip from "ready". Refuse to "go live" a mosque that hasn't paid
  // (still in_progress) or is already live, so accidental clicks don't
  // skip the payment gate or backwards-flip a launched mosque.
  const { data: mosque, error: lookupError } = await supabase
    .from("mosques")
    .select("id, name, onboarding_status, launched_at")
    .eq("id", mosqueId)
    .single();

  if (lookupError || !mosque) {
    return NextResponse.json({ error: "Mosque not found." }, { status: 404 });
  }

  if (mosque.onboarding_status === "live") {
    return NextResponse.json(
      { ok: true, alreadyLive: true, mosqueName: mosque.name },
      { status: 200 }
    );
  }

  if (mosque.onboarding_status !== "ready") {
    return NextResponse.json(
      {
        error: `Mosque is not ready to go live (current status: ${mosque.onboarding_status ?? "null"}).`,
      },
      { status: 409 }
    );
  }

  const launchedAt = mosque.launched_at ?? new Date().toISOString();

  const { error: mosqueUpdateError } = await supabase
    .from("mosques")
    .update({
      onboarding_status: "live",
      launched_at: launchedAt,
    })
    .eq("id", mosqueId);

  if (mosqueUpdateError) {
    return NextResponse.json(
      { error: `Failed to update mosque: ${mosqueUpdateError.message}` },
      { status: 500 }
    );
  }

  // Move pipeline_stages alongside the mosque so the pipeline kanban reflects
  // the new state. Best-effort — log but don't fail if pipeline_stages is missing.
  const { error: stageError } = await supabase
    .from("pipeline_stages")
    .update({ stage: "live", updated_at: new Date().toISOString() })
    .eq("mosque_id", mosqueId);

  if (stageError) {
    console.warn(
      `mark-live: mosque flipped but pipeline stage update failed for ${mosqueId}:`,
      stageError.message
    );
  }

  // Audit log so we can reconstruct who launched what.
  await supabase.from("activity_log").insert({
    mosque_id: mosqueId,
    actor_id: session.userId,
    action: "mosque_marked_live",
    entity_type: "mosque",
    entity_id: mosqueId,
    entity_name: mosque.name ?? null,
    metadata: { launched_at: launchedAt },
  });

  return NextResponse.json({
    ok: true,
    mosqueName: mosque.name,
    launchedAt,
  });
}
