import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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
    .from("reels")
    .select(
      "reel_id, mosque_id, title, caption, video_url, thumbnail_url, duration_sec, is_published, display_order, created_at"
    )
    .eq("mosque_id", mosqueId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const { searchParams } = new URL(request.url);
  const reelId = searchParams.get("id");
  if (!reelId) {
    return NextResponse.json(
      { error: "id query param required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("reels")
    .delete()
    .eq("reel_id", reelId)
    .eq("mosque_id", mosqueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
