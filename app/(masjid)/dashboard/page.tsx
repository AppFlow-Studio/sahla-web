import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ONBOARDING_CATEGORIES, ALL_TASKS } from "../components/onboarding-tasks";
import { getMosqueOnboardingData } from "../data";
import OnboardingDashboardClient from "../OnboardingDashboardClient";

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
    />
  );
}
