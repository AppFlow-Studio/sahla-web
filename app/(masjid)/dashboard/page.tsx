import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ONBOARDING_CATEGORIES, ALL_TASKS } from "../components/onboarding-tasks";
import { getMosqueOnboardingData } from "../data";
import OnboardingDashboardClient from "../OnboardingDashboardClient";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function OnboardingDashboard() {
  const session = await auth();
  const orgId = session.orgId;

  if (!orgId) {
    redirect("/onboarding");
  }

  const mosque = await getMosqueOnboardingData(orgId);
  const progress = (mosque?.onboarding_progress as Record<string, boolean>) || {};
  const onboardingStatus = typeof mosque?.onboarding_status === "string" ? mosque.onboarding_status : null;
  const needsOnboarding = onboardingStatus === "in_progress";
  const mosqueName = mosque?.name?.trim() || "This masjid";
  const completed = ALL_TASKS.filter((t) => progress[t.id] === true).length;
  const total = ALL_TASKS.length;
  const pct = Math.round((completed / total) * 100);

  // Find first incomplete task
  const nextTask = ALL_TASKS.find((t) => progress[t.id] !== true);

  // CRM CTA — surface only when the mosque is past onboarding AND has the
  // CRM tier active. Same feature-flags view the (crm) layout gate uses.
  let crmAvailable = false;
  if (
    mosque?.id &&
    (onboardingStatus === "ready" || onboardingStatus === "live")
  ) {
    const supabase = createAdminSupabaseClient();
    const { data: flags } = await supabase
      .from("mosque_feature_flags")
      .select("has_crm_access")
      .eq("mosque_id", mosque.id)
      .maybeSingle();
    crmAvailable = !!flags?.has_crm_access;
  }

  return (
    <OnboardingDashboardClient
      mosqueName={mosqueName}
      needsOnboarding={needsOnboarding}
      completed={completed}
      total={total}
      pct={pct}
      nextTask={nextTask ? { id: nextTask.id, label: nextTask.label } : null}
      categories={ONBOARDING_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        tasks: cat.tasks.map((t) => ({ id: t.id, label: t.label })),
      }))}
      progress={progress}
      crmAvailable={crmAvailable}
      onboardingStatus={onboardingStatus}
    />
  );
}
