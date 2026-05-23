import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Stage } from "@/app/components/kanban/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const VALID_STAGES = new Set<Stage>([
  "lead",
  "contacted",
  "demo",
  "contract",
  "onboarding",
  "live",
]);

type MoveRequest = {
  mosqueId: string;
  newStage: Stage;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<MoveRequest>;
  const mosqueId = body.mosqueId?.trim();
  const newStage = body.newStage;

  if (!mosqueId || !newStage || !VALID_STAGES.has(newStage)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Find the pipeline row — could be linked by mosque_id or be the row's own id
  const { data: pipelineRow, error: pipelineReadError } = await supabase
    .from("pipeline_stages")
    .select("id, mosque_id")
    .or(`mosque_id.eq.${mosqueId},id.eq.${mosqueId}`)
    .limit(1)
    .maybeSingle();

  if (pipelineReadError || !pipelineRow) {
    return NextResponse.json({ error: "Pipeline entry not found." }, { status: 404 });
  }

  // Validation gates only apply when there's a linked mosque record
  if (pipelineRow.mosque_id && (newStage === "onboarding" || newStage === "live")) {
    const { data: mosqueRow, error: mosqueReadError } = await supabase
      .from("mosques")
      .select("id, app_name, onboarding_status, subscription_status")
      .eq("id", pipelineRow.mosque_id)
      .single();

    if (!mosqueReadError && mosqueRow) {
      if (newStage === "onboarding") {
        const hasAccount = Boolean(mosqueRow.app_name) || mosqueRow.onboarding_status !== null;
        if (!hasAccount) {
          return NextResponse.json(
            { error: "Cannot move to Onboarding: account has not been created yet." },
            { status: 422 }
          );
        }
      }

      if (newStage === "live") {
        const subscriptionStatus = (mosqueRow.subscription_status ?? "").toLowerCase();
        const isActiveSubscription =
          subscriptionStatus === "active" || subscriptionStatus === "trialing";
        if (!isActiveSubscription) {
          return NextResponse.json(
            { error: "Cannot move to Live: subscription is not active." },
            { status: 422 }
          );
        }
      }
    }
  }

  const updatedAt = new Date().toISOString();

  const { error: stageUpdateError } = await supabase
    .from("pipeline_stages")
    .update({ stage: newStage, updated_at: updatedAt })
    .eq("id", pipelineRow.id);

  if (stageUpdateError) {
    return NextResponse.json(
      { error: `Failed to update stage: ${stageUpdateError.message}` },
      { status: 500 }
    );
  }

  // Update mosque onboarding status when linked
  if (pipelineRow.mosque_id && (newStage === "onboarding" || newStage === "live")) {
    const onboardingStatus = newStage === "live" ? "live" : "in_progress";
    const { error: mosqueUpdateError } = await supabase
      .from("mosques")
      .update({ onboarding_status: onboardingStatus })
      .eq("id", pipelineRow.mosque_id);

    if (mosqueUpdateError) {
      return NextResponse.json(
        {
          error: `Stage moved, but failed to update mosque onboarding status: ${mosqueUpdateError.message}`,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, updatedAt });
}
