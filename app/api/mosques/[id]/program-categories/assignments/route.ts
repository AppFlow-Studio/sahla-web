import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Onboarding-scoped counterpart to /api/crm/program-categories/assignments.
// The CRM route replaces a whole *category's* program list; here we do the
// inverse — replace the set of categories a single *program* belongs to. That
// matches the onboarding flow where you assign a program to its categories at
// the moment you add it.

// GET ?contentId=xxx -> { categoryIds: string[] }  (one program's categories)
// GET (no param)     -> { assignments: { categoryId, contentId }[] }  (whole mosque)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const contentId = new URL(request.url).searchParams.get("contentId");
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from("program_category_content")
    .select("category_id, content_id, sort_order")
    .eq("mosque_id", mosqueId)
    .order("sort_order", { ascending: true });
  if (contentId) query = query.eq("content_id", contentId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows =
    (data as { category_id: string; content_id: string }[] | null) ?? [];

  if (contentId) {
    return NextResponse.json({ categoryIds: rows.map((r) => r.category_id) });
  }
  return NextResponse.json({
    assignments: rows.map((r) => ({
      categoryId: r.category_id,
      contentId: r.content_id,
    })),
  });
}

// POST { contentId, categoryIds } -> replace this program's category set.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const body = (await request.json().catch(() => null)) as
    | { contentId?: string; categoryIds?: string[] }
    | null;

  if (!body?.contentId || !Array.isArray(body.categoryIds)) {
    return NextResponse.json(
      { error: "contentId and categoryIds[] required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();

  // The program must belong to this mosque.
  const { data: content } = await supabase
    .from("content_items")
    .select("content_id")
    .eq("content_id", body.contentId)
    .eq("mosque_id", mosqueId)
    .maybeSingle();
  if (!content) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  // Only keep categories that belong to this mosque (defends against stray ids).
  const { data: ownedCats } = await supabase
    .from("program_categories")
    .select("id")
    .eq("mosque_id", mosqueId)
    .in("id", body.categoryIds.length ? body.categoryIds : ["__none__"]);
  const validCatIds = new Set(
    ((ownedCats as { id: string }[] | null) ?? []).map((r) => r.id)
  );
  const categoryIds = body.categoryIds.filter((id) => validCatIds.has(id));

  // Replace: clear this program's rows, then re-add for each chosen category.
  const { error: delError } = await supabase
    .from("program_category_content")
    .delete()
    .eq("mosque_id", mosqueId)
    .eq("content_id", body.contentId);
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  if (categoryIds.length > 0) {
    // Append to the end of each category — sort_order = current row count.
    const { data: existing } = await supabase
      .from("program_category_content")
      .select("category_id")
      .eq("mosque_id", mosqueId)
      .in("category_id", categoryIds);
    const nextOrder = new Map<string, number>();
    for (const r of (existing as { category_id: string }[] | null) ?? []) {
      nextOrder.set(r.category_id, (nextOrder.get(r.category_id) ?? 0) + 1);
    }

    const rows = categoryIds.map((category_id) => ({
      category_id,
      content_id: body.contentId!,
      mosque_id: mosqueId,
      sort_order: nextOrder.get(category_id) ?? 0,
    }));
    const { error: insError } = await supabase
      .from("program_category_content")
      .insert(rows);
    if (insError) {
      return NextResponse.json({ error: insError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ categoryIds });
}
