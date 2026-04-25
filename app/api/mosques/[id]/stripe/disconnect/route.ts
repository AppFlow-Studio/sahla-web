import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();

  // Auth: check clerk_org_id for graduated leads where mosque.id is a UUID
  {
    const { data: authMosque } = await supabase
      .from("mosques")
      .select("clerk_org_id")
      .eq("id", mosqueId)
      .single();
    if (session.orgId && session.orgId !== mosqueId && session.orgId !== authMosque?.clerk_org_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Clear stripe_account_id (don't delete the Stripe account — mosque owns it)
  await supabase
    .from("mosques")
    .update({ stripe_account_id: null })
    .eq("id", mosqueId);

  // Un-mark onboarding step
  const { data: mosque } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  if (mosque) {
    const progress = (mosque.onboarding_progress as Record<string, boolean>) || {};
    progress.stripe_connect = false;
    await supabase
      .from("mosques")
      .update({ onboarding_progress: progress })
      .eq("id", mosqueId);
  }

  return NextResponse.json({ success: true });
}
