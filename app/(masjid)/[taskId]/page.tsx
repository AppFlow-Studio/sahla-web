import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ALL_TASKS } from "../components/onboarding-tasks";
import { getMosqueOnboardingData } from "../data";
import MosqueProfilePanel from "./panels/MosqueProfilePanel";
import AppBrandingPanel from "./panels/AppBrandingPanel";
import PrayerTimesOnboardingPanel from "./panels/PrayerTimesOnboardingPanel";
import JummahSetupPanel from "./panels/JummahSetupPanel";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = ALL_TASKS.find((t) => t.id === taskId);

  if (!task) {
    notFound();
  }

  const session = await auth();
  if (!session.orgId) {
    redirect("/select-org");
  }

  const mosque = await getMosqueOnboardingData(session.orgId);
  if (!mosque) {
    redirect("/select-org");
  }

  // Fetch task-specific data
  const supabase = createAdminSupabaseClient();
  let iqamahConfig = null;
  let jummahRecords = null;

  if (taskId === "prayer_times") {
    const { data } = await supabase
      .from("iqamah_config")
      .select("*")
      .eq("mosque_id", session.orgId);
    iqamahConfig = data ?? [];
  }

  if (taskId === "jummah_setup") {
    const { data } = await supabase
      .from("jummah")
      .select("*")
      .eq("mosque_id", session.orgId)
      .order("prayer_time");
    jummahRecords = data ?? [];
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`text-[9px] font-bold rounded px-1.5 py-0.5 ${
            task.badge === "REQ"
              ? "bg-amber-100 text-amber-700"
              : "bg-stone-100 text-stone-500"
          }`}
        >
          {task.badge}
        </span>
        <span className="text-[11px] text-stone-400">{task.timeEstimate}</span>
      </div>
      <h1 className="text-[24px] font-bold text-stone-900">{task.label}</h1>
      <p className="mt-1 text-[14px] text-stone-500">{task.description}</p>

      <div className="mt-8">
        {taskId === "mosque_profile" && (
          <MosqueProfilePanel mosque={mosque} />
        )}
        {taskId === "app_branding" && (
          <AppBrandingPanel mosque={mosque} />
        )}
        {taskId === "prayer_times" && (
          <PrayerTimesOnboardingPanel
            mosque={mosque}
            existingConfig={iqamahConfig ?? []}
          />
        )}
        {taskId === "jummah_setup" && (
          <JummahSetupPanel
            mosque={mosque}
            existingJummah={jummahRecords ?? []}
          />
        )}
        {!["mosque_profile", "app_branding", "prayer_times", "jummah_setup"].includes(taskId) && (
          <div className="rounded-xl border-2 border-dashed border-stone-200 bg-white p-12 text-center">
            <p className="text-[14px] text-stone-400">Task panel coming soon</p>
            <p className="mt-1 text-[12px] text-stone-300">This form will be built in a follow-up ticket</p>
          </div>
        )}
      </div>
    </div>
  );
}
