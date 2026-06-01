import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

export type PipelineMosqueNote = {
  id: string;
  author_name: string | null;
  content: string;
  created_at: string;
};

export type PipelineMosqueDetails = {
  mosque: {
    id: string;
    name: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    app_name: string | null;
    onboarding_status: string | null;
  };
  pipeline: {
    contact_name: string | null;
    contact_email: string | null;
    stage: string | null;
    updated_at: string | null;
  } | null;
  notes: PipelineMosqueNote[];
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // HQ-only endpoint — pipeline data is internal.
  if (!SAHLA_HQ_ORG_ID || session.orgId !== SAHLA_HQ_ORG_ID) {
    // Fall back to a membership check so cross-org Sahla staff also pass.
    try {
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({
        userId: session.userId,
      });
      const isInHQ = memberships.data.some(
        (m) => m.organization.id === SAHLA_HQ_ORG_ID
      );
      if (!isInHQ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();

  const [mosqueRes, pipelineRes, notesRes] = await Promise.all([
    supabase
      .from("mosques")
      .select(
        "id, name, city, state, address, phone, email, app_name, onboarding_status"
      )
      .eq("id", mosqueId)
      .maybeSingle(),
    supabase
      .from("pipeline_stages")
      .select("contact_name, contact_email, stage, updated_at")
      .eq("mosque_id", mosqueId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("mosque_notes")
      .select("id, author_name, content, created_at")
      .eq("mosque_id", mosqueId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (mosqueRes.error || !mosqueRes.data) {
    return NextResponse.json(
      { error: mosqueRes.error?.message ?? "Mosque not found" },
      { status: 404 }
    );
  }

  const payload: PipelineMosqueDetails = {
    mosque: mosqueRes.data as PipelineMosqueDetails["mosque"],
    pipeline:
      (pipelineRes.data as PipelineMosqueDetails["pipeline"] | null) ?? null,
    notes: ((notesRes.data ?? []) as PipelineMosqueNote[]) ?? [],
  };

  return NextResponse.json(payload);
}
