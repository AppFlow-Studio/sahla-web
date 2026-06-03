import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmTemplate = {
  id: string;
  name: string;
  title: string;
  body: string;
  audience: "all" | "program" | "event" | "tag";
  audienceLabel: string;
  lastUsedAt: string | null;
  usageCount: number;
};

type TemplateRow = {
  id: number;
  name: string | null;
  title: string | null;
  body: string | null;
  default_audience: string | null;
  audience_filter: Record<string, unknown> | null;
  last_used_at: string | null;
  usage_count: number | null;
};

function rowToTemplate(row: TemplateRow): CrmTemplate {
  const audience = (row.default_audience as CrmTemplate["audience"]) ?? "all";
  const filter = row.audience_filter ?? {};
  const audienceLabel =
    typeof filter.label === "string" ? filter.label : labelFor(audience);
  return {
    id: String(row.id),
    name: row.name ?? "Untitled",
    title: row.title ?? "",
    body: row.body ?? "",
    audience,
    audienceLabel,
    lastUsedAt: row.last_used_at,
    usageCount: row.usage_count ?? 0,
  };
}

function labelFor(audience: CrmTemplate["audience"]): string {
  switch (audience) {
    case "program":
      return "Program RSVPs";
    case "event":
      return "Event RSVPs";
    case "tag":
      return "Tagged group";
    default:
      return "Everyone";
  }
}

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ templates: [] });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .select(
      "id, name, title, body, default_audience, audience_filter, last_used_at, usage_count"
    )
    .eq("mosque_id", access.mosqueId)
    .order("last_used_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    templates: ((data as TemplateRow[] | null) ?? []).map(rowToTemplate),
  });
}

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        title?: string;
        body?: string;
        audience?: CrmTemplate["audience"];
        audienceLabel?: string;
      }
    | null;

  if (!body?.name?.trim() || !body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "name, title, and body are required" },
      { status: 400 }
    );
  }

  const session = await auth();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notification_templates")
    .insert({
      mosque_id: access.mosqueId,
      name: body.name.trim(),
      title: body.title.trim(),
      body: body.body.trim(),
      default_audience: body.audience ?? "all",
      audience_filter: body.audienceLabel
        ? { label: body.audienceLabel }
        : {},
      created_by: session?.userId ?? null,
    })
    .select(
      "id, name, title, body, default_audience, audience_filter, last_used_at, usage_count"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: rowToTemplate(data as TemplateRow) });
}

export async function DELETE(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("notification_templates")
    .delete()
    .eq("id", Number(id))
    .eq("mosque_id", access.mosqueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
