import { getCurrentMosque } from "../../_lib/getCurrentMosque";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import BusinessAdsConfigSummary, {
  type OnboardingAdsConfig,
} from "./BusinessAdsConfigSummary";
import BusinessAdsClient from "./BusinessAdsClient";

export const metadata = {
  title: "Business Ads · Mosque CRM",
};

async function loadAdsConfig(
  mosqueId: string
): Promise<OnboardingAdsConfig | null> {
  if (mosqueId === "hq_preview") return null;
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("mosques")
    .select("ad_monthly_price_cents, ad_onboarding_fee_cents, ads_enabled")
    .eq("id", mosqueId)
    .maybeSingle();
  if (!data) return null;
  // All three now come from authoritative columns the app reads/charges from.
  return {
    enabled: !!data.ads_enabled,
    onboardingFee: (data.ad_onboarding_fee_cents ?? 0) / 100,
    monthlyRate: (data.ad_monthly_price_cents ?? 0) / 100,
  };
}

export default async function BusinessAdsPage() {
  const result = await getCurrentMosque();
  const adsConfig =
    result.kind === "ok"
      ? await loadAdsConfig(result.mosque.id)
      : null;

  return (
    <>
      {adsConfig ? <BusinessAdsConfigSummary config={adsConfig} /> : null}
      <BusinessAdsClient />
    </>
  );
}
