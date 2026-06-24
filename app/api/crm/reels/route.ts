import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmReel = {
  id: string;
  title: string | null;
  caption: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  isPublished: boolean;
  createdAt: string;
};

type ReelRow = {
  reel_id: string;
  title: string | null;
  caption: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_sec: number | null;
  is_published: boolean;
  created_at: string;
};

function rowToReel(row: ReelRow): CrmReel {
  return {
    id: row.reel_id,
    title: row.title,
    caption: row.caption,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    durationSec: row.duration_sec,
    isPublished: row.is_published,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({ reels: [] satisfies CrmReel[] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("reels")
    .select(
      "reel_id, title, caption, video_url, thumbnail_url, duration_sec, is_published, created_at"
    )
    .eq("mosque_id", access.mosqueId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    reels: ((data as ReelRow[] | null) ?? []).map(rowToReel),
  });
}

export async function DELETE(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't delete — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id query param required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("reels")
    .delete()
    .eq("reel_id", id)
    .eq("mosque_id", access.mosqueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
