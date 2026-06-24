import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

/**
 * Read/update the business-ad pricing a mosque charges advertisers.
 *
 * Source of truth = `mosques.ad_monthly_price_cents` / `ad_onboarding_fee_cents`
 * (cents) — the same columns the app's `create-ad-subscription` edge function
 * reads. The onboarding summary JSON (`onboarding_progress._ads_config`, dollars)
 * is mirrored on write so the onboarding view stays consistent.
 *
 * API surface uses dollars; the DB stores cents.
 */

export type AdPricing = {
  onboardingFee: number;
  monthlyRate: number;
  enabled: boolean;
};

const DEFAULT_MONTHLY_CENTS = 5000;
const DEFAULT_ONBOARDING_CENTS = 10000;

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({
      onboardingFee: DEFAULT_ONBOARDING_CENTS / 100,
      monthlyRate: DEFAULT_MONTHLY_CENTS / 100,
      enabled: false,
    } satisfies AdPricing);
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("mosques")
    .select("ad_monthly_price_cents, ad_onboarding_fee_cents, ads_enabled")
    .eq("id", access.mosqueId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    onboardingFee: (data?.ad_onboarding_fee_cents ?? DEFAULT_ONBOARDING_CENTS) / 100,
    monthlyRate: (data?.ad_monthly_price_cents ?? DEFAULT_MONTHLY_CENTS) / 100,
    enabled: !!data?.ads_enabled,
  } satisfies AdPricing);
}

export async function PATCH(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    onboardingFee?: number | string;
    monthlyRate?: number | string;
    enabled?: boolean;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const wantsPriceUpdate =
    body.onboardingFee !== undefined || body.monthlyRate !== undefined;

  const supabase = createAdminSupabaseClient();

  // Mirror everything into _ads_config (preserving other fields) so the
  // onboarding summary never drifts from the authoritative columns.
  const { data: existing } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", access.mosqueId)
    .single();
  const progress = ((existing?.onboarding_progress ?? {}) as Record<string, unknown>);
  const adsCfg = ((progress._ads_config ?? {}) as Record<string, unknown>);

  const update: Record<string, unknown> = {};

  if (wantsPriceUpdate) {
    const monthlyCents = Math.round(Number(body.monthlyRate) * 100);
    const onboardingCents = Math.round(Number(body.onboardingFee) * 100);
    if (
      !Number.isFinite(monthlyCents) ||
      monthlyCents < 0 ||
      !Number.isFinite(onboardingCents) ||
      onboardingCents < 0
    ) {
      return NextResponse.json(
        { error: "Prices must be non-negative numbers" },
        { status: 400 }
      );
    }
    update.ad_monthly_price_cents = monthlyCents;
    update.ad_onboarding_fee_cents = onboardingCents;
    adsCfg.onboardingFee = String(onboardingCents / 100);
    adsCfg.monthlyRate = String(monthlyCents / 100);
  }

  if (typeof body.enabled === "boolean") {
    update.ads_enabled = body.enabled;
    adsCfg.enabled = body.enabled;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  progress._ads_config = adsCfg;
  update.onboarding_progress = progress;

  const { error } = await supabase
    .from("mosques")
    .update(update)
    .eq("id", access.mosqueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
