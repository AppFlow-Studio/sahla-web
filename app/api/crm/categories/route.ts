import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmCategory = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type CrmCategoryInput = {
  name: string;
  icon?: string | null;
  is_active?: boolean;
};

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "category";

function rowToCategory(row: CategoryRow): CrmCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    displayOrder: row.display_order,
    isActive: row.is_active,
  };
}

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({ categories: [] satisfies CrmCategory[] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("display_categories")
    .select("id, name, slug, icon, display_order, is_active")
    .eq("mosque_id", access.mosqueId)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    categories: ((data as CategoryRow[] | null) ?? []).map(rowToCategory),
  });
}

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
    | { categories?: CrmCategoryInput[] }
    | null;

  if (!body || !Array.isArray(body.categories)) {
    return NextResponse.json(
      { error: "categories array required" },
      { status: 400 }
    );
  }

  const trimmed = body.categories
    .map((c) => ({
      name: (c.name ?? "").trim(),
      icon: c.icon?.trim() || null,
      is_active: c.is_active ?? true,
    }))
    .filter((c) => c.name.length > 0);

  const slugCounts = new Map<string, number>();
  const rows = trimmed.map((c, idx) => {
    const base = slugify(c.name);
    const n = (slugCounts.get(base) ?? 0) + 1;
    slugCounts.set(base, n);
    return {
      mosque_id: access.mosqueId,
      name: c.name,
      slug: n === 1 ? base : `${base}-${n}`,
      icon: c.icon,
      display_order: idx,
      is_active: c.is_active,
    };
  });

  const supabase = createAdminSupabaseClient();

  const { error: deleteError } = await supabase
    .from("display_categories")
    .delete()
    .eq("mosque_id", access.mosqueId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ categories: [] satisfies CrmCategory[] });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("display_categories")
    .insert(rows)
    .select("id, name, slug, icon, display_order, is_active");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    categories: ((inserted as CategoryRow[] | null) ?? []).map(rowToCategory),
  });
}
