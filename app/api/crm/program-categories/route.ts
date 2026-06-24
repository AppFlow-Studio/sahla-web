import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export const AUDIENCE_FILTERS = ["All", "Kids", "Youth", "Adults"] as const;
export type AudienceFilter = (typeof AUDIENCE_FILTERS)[number];

export type CrmProgramCategory = {
  id: string;
  title: string;
  imageUrl: string | null;
  bgColor: string | null;
  audienceFilter: AudienceFilter;
  sortOrder: number;
};

export type CrmProgramCategoryInput = {
  /** Present when editing an existing row; omitted/undefined for new rows. */
  id?: string | null;
  title: string;
  imageUrl?: string | null;
  bgColor?: string | null;
  audienceFilter?: AudienceFilter;
};

type CategoryRow = {
  id: string;
  title: string;
  image_url: string | null;
  bg_color: string | null;
  audience_filter: string;
  sort_order: number;
};

function rowToCategory(row: CategoryRow): CrmProgramCategory {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    bgColor: row.bg_color,
    audienceFilter: (AUDIENCE_FILTERS as readonly string[]).includes(
      row.audience_filter
    )
      ? (row.audience_filter as AudienceFilter)
      : "All",
    sortOrder: row.sort_order,
  };
}

const SELECT = "id, title, image_url, bg_color, audience_filter, sort_order";

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({
      categories: [] satisfies CrmProgramCategory[],
    });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("program_categories")
    .select(SELECT)
    .eq("mosque_id", access.mosqueId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    categories: ((data as CategoryRow[] | null) ?? []).map(rowToCategory),
  });
}

/**
 * Replace this mosque's full set of program cards in one call. The client sends
 * the complete ordered list; we preserve ids for rows that already exist
 * (so cover URLs aren't churned), insert new ones, prune anything no longer
 * present, and stamp sort_order from array position.
 */
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
    | { categories?: CrmProgramCategoryInput[] }
    | null;

  if (!body || !Array.isArray(body.categories)) {
    return NextResponse.json(
      { error: "categories array required" },
      { status: 400 }
    );
  }

  const cleaned = body.categories
    .map((c) => ({
      id: c.id ?? null,
      title: (c.title ?? "").trim(),
      image_url: c.imageUrl?.trim() || null,
      bg_color: c.bgColor?.trim() || null,
      audience_filter: (AUDIENCE_FILTERS as readonly string[]).includes(
        c.audienceFilter ?? ""
      )
        ? (c.audienceFilter as AudienceFilter)
        : "All",
    }))
    .filter((c) => c.title.length > 0);

  const supabase = createAdminSupabaseClient();

  // Prune rows the client dropped.
  const keepIds = cleaned
    .map((c) => c.id)
    .filter((id): id is string => Boolean(id));
  let pruneQuery = supabase
    .from("program_categories")
    .delete()
    .eq("mosque_id", access.mosqueId);
  if (keepIds.length > 0) {
    pruneQuery = pruneQuery.not("id", "in", `(${keepIds.join(",")})`);
  }
  const { error: pruneError } = await pruneQuery;
  if (pruneError) {
    return NextResponse.json({ error: pruneError.message }, { status: 500 });
  }

  // Upsert each row in order. Insert (no id) vs update (existing id).
  for (let index = 0; index < cleaned.length; index++) {
    const c = cleaned[index];
    if (c.id) {
      const { error } = await supabase
        .from("program_categories")
        .update({
          title: c.title,
          image_url: c.image_url,
          bg_color: c.bg_color,
          audience_filter: c.audience_filter,
          sort_order: index,
        })
        .eq("id", c.id)
        .eq("mosque_id", access.mosqueId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from("program_categories").insert({
        mosque_id: access.mosqueId,
        title: c.title,
        image_url: c.image_url,
        bg_color: c.bg_color,
        audience_filter: c.audience_filter,
        sort_order: index,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  const { data, error } = await supabase
    .from("program_categories")
    .select(SELECT)
    .eq("mosque_id", access.mosqueId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    categories: ((data as CategoryRow[] | null) ?? []).map(rowToCategory),
  });
}
