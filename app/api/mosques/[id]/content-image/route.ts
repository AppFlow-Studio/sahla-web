import { auth } from "@clerk/nextjs/server";
import { uploadToBunny } from "@/lib/bunny";
import { NextResponse } from "next/server";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const MAX_BYTES = 5 * 1024 * 1024;

// Cover-image upload for content_items (events and programs) during onboarding.
// Uploads to the shared `sahla-co` Bunny storage zone under the same `content/`
// prefix the app's upload-content-image edge function uses, and returns the
// public CDN URL that gets persisted on `content_items.image`.
// Validation mirrors the twin at /api/mosques/[id]/program-card-cover.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
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
  const path = `content/${mosqueId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  try {
    const url = await uploadToBunny(path, file);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
