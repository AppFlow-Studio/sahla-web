import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const AUDIENCE_FILTERS = ["All", "Kids", "Youth", "Adults"] as const;
type AudienceFilter = (typeof AUDIENCE_FILTERS)[number];

export type ProgramCardInput = {
  title: string;
  image_url?: string | null;
  bg_color?: string | null;
  audience_filter?: AudienceFilter;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("program_categories")
    .select("id, title, image_url, bg_color, audience_filter, sort_order")
    .eq("mosque_id", mosqueId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

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
    | { categories?: ProgramCardInput[]; markComplete?: boolean }
    | null;

  if (!body || !Array.isArray(body.categories)) {
    return NextResponse.json(
      { error: "categories array required" },
      { status: 400 }
    );
  }

  const rows = body.categories
    .map((c, idx) => ({
      mosque_id: mosqueId,
      title: (c.title ?? "").trim(),
      image_url: c.image_url?.trim() || null,
      bg_color: c.bg_color?.trim() || null,
      audience_filter: (AUDIENCE_FILTERS as readonly string[]).includes(
        c.audience_filter ?? ""
      )
        ? (c.audience_filter as AudienceFilter)
        : "All",
      sort_order: idx,
    }))
    .filter((c) => c.title.length > 0)
    // Re-stamp sort_order after filtering blanks so it stays contiguous.
    .map((c, idx) => ({ ...c, sort_order: idx }));

  const supabase = createAdminSupabaseClient();

  // Batch replace — same convention as the categories/jummah onboarding routes.
  // The client always sends the full list, so wiping + reinserting is safe and
  // keeps the API to a single POST.
  const { error: deleteError } = await supabase
    .from("program_categories")
    .delete()
    .eq("mosque_id", mosqueId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("program_categories")
      .insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  if (body.markComplete) {
    const { data: mosque } = await supabase
      .from("mosques")
      .select("onboarding_progress")
      .eq("id", mosqueId)
      .single();

    const progress =
      (mosque?.onboarding_progress as Record<string, boolean>) || {};
    progress.categories = true;
    await supabase
      .from("mosques")
      .update({ onboarding_progress: progress })
      .eq("id", mosqueId);
  }

  return NextResponse.json({ success: true, count: rows.length });
}
