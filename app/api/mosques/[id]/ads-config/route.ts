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

  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  const progress = ((data?.onboarding_progress ?? {}) as Record<string, unknown>);
  progress._ads_config = config;
  if (markComplete) {
    progress.ads_config = true;
  }

  // Persist the chosen pricing to the real mosques columns the app's
  // create-ad-subscription edge function reads (dollars in the form → cents in
  // the DB). Without this the app silently falls back to its default pricing.
  const update: Record<string, unknown> = { onboarding_progress: progress };
  const monthlyCents = Math.round(parseFloat(config?.monthlyRate) * 100);
  const onboardingCents = Math.round(parseFloat(config?.onboardingFee) * 100);
  if (Number.isFinite(monthlyCents) && monthlyCents >= 0) {
    update.ad_monthly_price_cents = monthlyCents;
  }
  if (Number.isFinite(onboardingCents) && onboardingCents >= 0) {
    update.ad_onboarding_fee_cents = onboardingCents;
  }
  // The enable toggle gates whether the app shows the advertise flow at all.
  if (typeof config?.enabled === "boolean") {
    update.ads_enabled = config.enabled;
  }

  const { error } = await supabase
    .from("mosques")
    .update(update)
    .eq("id", mosqueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
