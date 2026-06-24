import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type ProgramAssignment = { categoryId: string; contentId: string };

// GET                  -> { assignments: ProgramAssignment[] }  (whole mosque)
// GET ?categoryId=xxx  -> { contentIds: string[] }              (one card)
export async function GET(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({ assignments: [], contentIds: [] });
  }

  const categoryId = new URL(request.url).searchParams.get("categoryId");
  const supabase = createAdminSupabaseClient();

  let q = supabase
    .from("program_category_content")
    .select("category_id, content_id, sort_order")
    .eq("mosque_id", access.mosqueId)
    .order("sort_order", { ascending: true });
  if (categoryId) q = q.eq("category_id", categoryId);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data as { category_id: string; content_id: string }[] | null) ?? [];

  if (categoryId) {
    return NextResponse.json({ contentIds: rows.map((r) => r.content_id) });
  }
  return NextResponse.json({
    assignments: rows.map((r) => ({
      categoryId: r.category_id,
      contentId: r.content_id,
    })),
  });
}

// POST { categoryId, contentIds } -> replace this card's assigned programs.
export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { categoryId?: string; contentIds?: string[] }
    | null;

  if (!body?.categoryId || !Array.isArray(body.contentIds)) {
    return NextResponse.json(
      { error: "categoryId and contentIds[] required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();

  // The card must belong to this mosque.
  const { data: category } = await supabase
    .from("program_categories")
    .select("id")
    .eq("id", body.categoryId)
    .eq("mosque_id", access.mosqueId)
    .maybeSingle();
  if (!category) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Only allow content that belongs to this mosque (defends against stray ids).
  const { data: owned } = await supabase
    .from("content_items")
    .select("content_id")
    .eq("mosque_id", access.mosqueId)
    .in("content_id", body.contentIds.length ? body.contentIds : ["__none__"]);
  const validIds = new Set(
    ((owned as { content_id: string }[] | null) ?? []).map((r) => r.content_id)
  );
  const contentIds = body.contentIds.filter((id) => validIds.has(id));

  // Replace: clear this card's rows, then insert the new set in order.
  const { error: delError } = await supabase
    .from("program_category_content")
    .delete()
    .eq("mosque_id", access.mosqueId)
    .eq("category_id", body.categoryId);
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  if (contentIds.length > 0) {
    const rows = contentIds.map((content_id, sort_order) => ({
      category_id: body.categoryId!,
      content_id,
      mosque_id: access.mosqueId,
      sort_order,
    }));
    const { error: insError } = await supabase
      .from("program_category_content")
      .insert(rows);
    if (insError) {
      return NextResponse.json({ error: insError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ contentIds });
}
