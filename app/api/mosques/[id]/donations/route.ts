import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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
  const body = await request.json();
  const { config, markComplete } = body;

  if (!config?.projectName?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  const progress = ((data?.onboarding_progress ?? {}) as Record<string, unknown>);
  progress._donations_config = config;
  if (markComplete) {
    progress.donations = true;
  }

  const { error } = await supabase
    .from("mosques")
    .update({ onboarding_progress: progress })
    .eq("id", mosqueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
