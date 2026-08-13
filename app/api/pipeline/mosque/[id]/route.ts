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
    // Pipeline-only lead: a `pipeline_stages` row that hasn't graduated to a
    // `mosques` row yet (created via "+ Add lead"). Its kanban card id is the
    // pipeline_stages id, so the mosques lookup above finds nothing. Build the
    // modal payload from the pipeline row instead of erroring "Mosque not
    // found". Notes live in the jsonb `notes` array as { text, at } entries.
    const { data: lead } = await supabase
      .from("pipeline_stages")
      .select(
        "id, mosque_name, city, contact_name, contact_email, stage, updated_at, notes"
      )
      .or(`id.eq.${mosqueId},mosque_id.eq.${mosqueId}`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lead) {
      return NextResponse.json(
        { error: mosqueRes.error?.message ?? "Mosque not found" },
        { status: 404 }
      );
    }

    const rawNotes = Array.isArray(lead.notes)
      ? (lead.notes as Array<{ text?: unknown; at?: unknown }>)
      : [];
    const notes: PipelineMosqueNote[] = rawNotes
      .map((n, i) => ({
        id: String(i),
        author_name: null,
        content: typeof n?.text === "string" ? n.text : "",
        created_at:
          typeof n?.at === "string" ? n.at : new Date(0).toISOString(),
      }))
      .filter((n) => n.content)
      .reverse(); // newest first, matching mosque_notes ordering

    const leadPayload: PipelineMosqueDetails = {
      // pipeline_stages has no state/address/phone/email/app_name/status —
      // those only exist once the lead becomes a mosque.
      mosque: {
        id: lead.id as string,
        name: (lead.mosque_name as string | null) ?? null,
        city: (lead.city as string | null) ?? null,
        state: null,
        address: null,
        phone: null,
        email: null,
        app_name: null,
        onboarding_status: null,
      },
      pipeline: {
        contact_name: (lead.contact_name as string | null) ?? null,
        contact_email: (lead.contact_email as string | null) ?? null,
        stage: (lead.stage as string | null) ?? null,
        updated_at: (lead.updated_at as string | null) ?? null,
      },
      notes,
    };

    return NextResponse.json(leadPayload);
  }

  const payload: PipelineMosqueDetails = {
    mosque: mosqueRes.data as PipelineMosqueDetails["mosque"],
    pipeline:
      (pipelineRes.data as PipelineMosqueDetails["pipeline"] | null) ?? null,
    notes: ((notesRes.data ?? []) as PipelineMosqueNote[]) ?? [],
  };

  return NextResponse.json(payload);
}
