import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export type CategoryInput = {
  name: string;
  icon?: string | null;
  is_active?: boolean;
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "category";

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
    .from("display_categories")
    .select("id, name, slug, icon, display_order, is_active")
    .eq("mosque_id", mosqueId)
    .order("display_order", { ascending: true });

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
    | { categories?: CategoryInput[]; markComplete?: boolean }
    | null;

  if (!body || !Array.isArray(body.categories)) {
    return NextResponse.json(
      { error: "categories array required" },
      { status: 400 }
    );
  }

  // Reject empty names — would violate the NOT NULL constraint and there's
  // no admin use case for a blank pill.
  const trimmed = body.categories
    .map((c) => ({
      name: (c.name ?? "").trim(),
      icon: c.icon?.trim() || null,
      is_active: c.is_active ?? true,
    }))
    .filter((c) => c.name.length > 0);

  // Disambiguate slug collisions when two categories normalize to the same
  // slug (e.g. "Kids " and "kids"). Append -2, -3, ... in input order.
  const slugCounts = new Map<string, number>();
  const rows = trimmed.map((c, idx) => {
    const base = slugify(c.name);
    const n = (slugCounts.get(base) ?? 0) + 1;
    slugCounts.set(base, n);
    return {
      mosque_id: mosqueId,
      name: c.name,
      slug: n === 1 ? base : `${base}-${n}`,
      icon: c.icon,
      display_order: idx,
      is_active: c.is_active,
    };
  });

  const supabase = createAdminSupabaseClient();

  // Batch replace: delete the mosque's existing rows, insert the new set.
  // Same pattern as the jummah POST handler — keeps the API surface tiny
  // (one POST, no per-row endpoints) and the SQL footprint small.
  const { error: deleteError } = await supabase
    .from("display_categories")
    .delete()
    .eq("mosque_id", mosqueId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("display_categories")
      .insert(rows);
    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
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
