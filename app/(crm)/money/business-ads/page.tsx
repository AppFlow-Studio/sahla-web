import { getCurrentMosque } from "../../_lib/getCurrentMosque";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import BusinessAdsConfigSummary, {
  type OnboardingAdsConfig,
} from "./BusinessAdsConfigSummary";
import BusinessAdsClient from "./BusinessAdsClient";

export const metadata = {
  title: "Business Ads · Mosque CRM",
};

async function loadOnboardingAdsConfig(
  mosqueId: string
): Promise<OnboardingAdsConfig | null> {
  if (mosqueId === "hq_preview") return null;
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .maybeSingle();
  const progress = (data?.onboarding_progress as Record<string, unknown> | null) ?? {};
  const raw = progress._ads_config as
    | { enabled?: boolean; onboardingFee?: string; monthlyRate?: string }
    | undefined;
  if (!raw) return null;
  return {
    enabled: !!raw.enabled,
    onboardingFee: Number(raw.onboardingFee ?? 0) || 0,
    monthlyRate: Number(raw.monthlyRate ?? 0) || 0,
  };
}

export default async function BusinessAdsPage() {
  const result = await getCurrentMosque();
  const adsConfig =
    result.kind === "ok"
      ? await loadOnboardingAdsConfig(result.mosque.id)
      : null;

  return (
    <>
      {adsConfig ? <BusinessAdsConfigSummary config={adsConfig} /> : null}
      <BusinessAdsClient />
    </>
  );
}
