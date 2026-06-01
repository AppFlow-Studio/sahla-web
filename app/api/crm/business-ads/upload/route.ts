import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't upload — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type (use PNG, JPG, or WebP)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 5 MB" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${access.mosqueId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const supabase = createAdminSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from("business-ads")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("business-ads")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
