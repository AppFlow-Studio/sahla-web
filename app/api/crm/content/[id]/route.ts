import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";
import {
  rowToContentItem,
  type ContentRow,
} from "../_lib/mapping";

const SELECT_COLS =
  "content_id, mosque_id, type, name, description, image, speakers, days, start_date, end_date, start_time, is_paid, price, max_capacity, current_count, is_weekly_program";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ item: null });

  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(SELECT_COLS)
    .eq("content_id", id)
    .eq("mosque_id", access.mosqueId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ item: null }, { status: 404 });

  return NextResponse.json({ item: rowToContentItem(data as ContentRow) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("content_items")
    .delete()
    .eq("content_id", id)
    .eq("mosque_id", access.mosqueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
