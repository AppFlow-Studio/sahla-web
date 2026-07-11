import { auth } from "@clerk/nextjs/server";
import { uploadToBunny } from "@/lib/bunny";
import { NextResponse } from "next/server";

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

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `logos/${mosqueId}/logo.${ext}`;

  try {
    // Bunny PUT overwrites in place; cache-bust so a re-upload shows immediately.
    const url = await uploadToBunny(path, file);
    return NextResponse.json({ url: `${url}?t=${Date.now()}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
