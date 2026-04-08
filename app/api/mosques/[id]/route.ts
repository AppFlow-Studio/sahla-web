import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ALLOWED_FIELDS = [
  "name", "address", "city", "state", "phone", "email", "timezone",
  "app_name", "logo_url", "brand_color", "accent_color", "secondary_color",
  "calculation_method", "school",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const body = await request.json();
  const { markComplete, ...fields } = body;

  // Filter to allowed fields only
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (ALLOWED_FIELDS.includes(key)) {
      updateData[key] = value;
    }
  }

  const supabase = createAdminSupabaseClient();

  // Update mosque fields + get current onboarding_progress
  const { data: mosque, error } = await supabase
    .from("mosques")
    .update(updateData)
    .eq("id", mosqueId)
    .select("onboarding_progress")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark task complete if requested
  if (markComplete && typeof markComplete === "string") {
    const progress = (mosque?.onboarding_progress as Record<string, boolean>) || {};
    progress[markComplete] = true;
    await supabase
      .from("mosques")
      .update({ onboarding_progress: progress })
      .eq("id", mosqueId);
  }

  return NextResponse.json({ success: true });
}
