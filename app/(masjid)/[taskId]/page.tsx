import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ALL_TASKS, ONBOARDING_CATEGORIES } from "../components/onboarding-tasks";
import { getMosqueOnboardingData } from "../data";
import TaskPageTransition from "./TaskPageTransition";
import { createStripeClient } from "@/lib/stripe";

// Lazy-load panels — only the active panel is compiled/loaded per request.
// This prevents Turbopack from parsing all 13 panels + their deps on every page load.
const MosqueProfilePanel = dynamic(() => import("./panels/MosqueProfilePanel"));
const AppBrandingPanel = dynamic(() => import("./panels/AppBrandingPanel"));
const PrayerTimesOnboardingPanel = dynamic(() => import("./panels/PrayerTimesOnboardingPanel"));
const JummahSetupPanel = dynamic(() => import("./panels/JummahSetupPanel"));
const SpeakersPanel = dynamic(() => import("./panels/SpeakersPanel"));
const ProgramsPanel = dynamic(() => import("./panels/ProgramsPanel"));
const EventsPanel = dynamic(() => import("./panels/EventsPanel"));
const StripeConnectPanel = dynamic(() => import("./panels/StripeConnectPanel"));
const InviteAdminsPanel = dynamic(() => import("./panels/InviteAdminsPanel"));
const DonationsPanel = dynamic(() => import("./panels/DonationsPanel"));
const BusinessAdsPanel = dynamic(() => import("./panels/BusinessAdsPanel"));
const PreviewAppPanel = dynamic(() => import("./panels/PreviewAppPanel"));
const LaunchMaterialsPanel = dynamic(() => import("./panels/LaunchMaterialsPanel"));
const GoLivePanel = dynamic(() => import("./panels/GoLivePanel"));

export default async function TaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ stripe?: string }>;
}) {
  const { taskId } = await params;
  const taskIndex = ALL_TASKS.findIndex((t) => t.id === taskId);
  const task = taskIndex >= 0 ? ALL_TASKS[taskIndex] : null;

  if (!task) {
    notFound();
  }

  const prevTask = taskIndex > 0 ? ALL_TASKS[taskIndex - 1] : null;
  const nextTask = taskIndex < ALL_TASKS.length - 1 ? ALL_TASKS[taskIndex + 1] : null;

  const session = await auth();
  if (!session.orgId) {
    redirect("/select-org");
  }

  const mosque = await getMosqueOnboardingData(session.orgId);
  if (!mosque) {
    redirect("/dashboard");
  }

  // Fetch task-specific data
  const supabase = createAdminSupabaseClient();
  let iqamahConfig = null;
  let jummahRecords = null;
  let speakersData = null;
  let programsData = null;
  let eventsData = null;
  if (taskId === "prayer_times") {
    const { data } = await supabase
      .from("iqamah_config")
      .select("*")
      .eq("mosque_id", mosque.id);
    iqamahConfig = data ?? [];
  }

  if (taskId === "jummah_setup") {
    const { data } = await supabase
      .from("jummah")
      .select("*")
      .eq("mosque_id", mosque.id)
      .order("prayer_time");
    jummahRecords = data ?? [];
  }

  if (taskId === "speakers") {
    const { data } = await supabase
      .from("speaker_data")
      .select("*")
      .eq("mosque_id", mosque.id)
      .order("created_at", { ascending: false });
    speakersData = data ?? [];
  }

  if (taskId === "programs" || taskId === "events") {
    // Fetch speakers for dropdown + content items
    const [speakersRes, contentRes] = await Promise.all([
      supabase.from("speaker_data").select("speaker_id, speaker_name").eq("mosque_id", mosque.id),
      supabase.from("content_items").select("*").eq("mosque_id", mosque.id).eq("type", taskId === "programs" ? "program" : "event").order("created_at", { ascending: false }),
    ]);
    speakersData = speakersRes.data ?? [];
    if (taskId === "programs") programsData = contentRes.data ?? [];
    else eventsData = contentRes.data ?? [];
  }

  const progress = ((mosque.onboarding_progress ?? {}) as Record<string, unknown>);

  let queuedInvites: { name: string; email: string; role: "org:admin" | "org:editor" | "org:viewer" }[] = [];
  if (taskId === "invite_admins") {
    queuedInvites = (progress._queued_invites as typeof queuedInvites) ?? [];
  }

  let donationsConfig = null;
  if (taskId === "donations") {
    donationsConfig = (progress._donations_config as {
      projectName: string;
      goalAmount: string;
      suggestedAmounts: number[];
      suggestedEnabled: boolean;
      recurringEnabled: boolean;
    }) ?? null;
  }

  let adsConfig = null;
  if (taskId === "ads_config") {
    adsConfig = (progress._ads_config as {
      enabled: boolean;
      onboardingFee: string;
      monthlyRate: string;
    }) ?? null;
  }

  let previewData = null;
  if (taskId === "preview_app") {
    const [speakersRes, programsRes, eventsRes, iqamahRes] = await Promise.all([
      supabase.from("speaker_data").select("speaker_id", { count: "exact", head: true }).eq("mosque_id", mosque.id),
      supabase.from("content_items").select("id", { count: "exact", head: true }).eq("mosque_id", mosque.id).eq("type", "program"),
      supabase.from("content_items").select("id", { count: "exact", head: true }).eq("mosque_id", mosque.id).eq("type", "event"),
      supabase.from("iqamah_config").select("id", { count: "exact", head: true }).eq("mosque_id", mosque.id),
    ]);
    previewData = {
      mosque: {
        id: mosque.id,
        name: mosque.name,
        app_name: mosque.app_name,
        brand_color: mosque.brand_color,
        logo_url: mosque.logo_url,
        city: mosque.city,
        state: mosque.state,
      },
      counts: {
        speakers: speakersRes.count ?? 0,
        programs: programsRes.count ?? 0,
        events: eventsRes.count ?? 0,
      },
      hasPrayerTimes: (iqamahRes.count ?? 0) > 0,
      hasStripe: !!(mosque as Record<string, unknown>).stripe_account_id,
      hasDonations: !!progress._donations_config,
    };
  }

  let goLiveData = null;
  if (taskId === "go_live") {
    const allOnboardingTasks = ONBOARDING_CATEGORIES.flatMap((c) => c.tasks)
      .filter((t) => t.id !== "go_live");
    goLiveData = {
      mosqueId: mosque.id,
      mosqueName: mosque.name,
      tasks: allOnboardingTasks.map((t) => ({
        id: t.id,
        label: t.label,
        required: t.badge === "REQ",
        completed: !!(progress as Record<string, boolean>)[t.id],
      })),
    };
  }

  let stripeStatus = null;
  if (taskId === "stripe_connect") {
    const stripeAccountId = (mosque as Record<string, unknown>).stripe_account_id as string | null;

    if (stripeAccountId) {
      try {
        const stripe = createStripeClient();
        const account = await stripe.accounts.retrieve(stripeAccountId);
        stripeStatus = {
          status: (account.charges_enabled ? "connected" :
            account.requirements?.past_due?.length ? "issues" : "pending") as "connected" | "pending" | "issues",
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          requirements: {
            currently_due: account.requirements?.currently_due ?? [],
            past_due: account.requirements?.past_due ?? [],
          },
          business_profile: { name: account.business_profile?.name ?? null },
        };
      } catch {
        stripeStatus = { status: "not_connected" as const };
      }
    } else {
      stripeStatus = { status: "not_connected" as const };
    }
  }

  const resolvedSearchParams = await searchParams;

  return (
    <TaskPageTransition taskId={taskId}>
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
        {taskId === "speakers" && (
          <SpeakersPanel mosqueId={mosque.id} initialSpeakers={speakersData ?? []} />
        )}
        {taskId === "programs" && (
          <ProgramsPanel mosqueId={mosque.id} initialPrograms={programsData ?? []} speakers={speakersData ?? []} />
        )}
        {taskId === "events" && (
          <EventsPanel mosqueId={mosque.id} initialEvents={eventsData ?? []} speakers={speakersData ?? []} />
        )}
        {taskId === "stripe_connect" && stripeStatus && (
          <StripeConnectPanel
            mosqueId={mosque.id}
            initialStatus={stripeStatus}
            stripeReturn={resolvedSearchParams.stripe}
          />
        )}
        {taskId === "invite_admins" && (
          <InviteAdminsPanel mosqueId={mosque.id} initialInvites={queuedInvites} />
        )}
        {taskId === "donations" && (
          <DonationsPanel
            mosqueId={mosque.id}
            initialConfig={donationsConfig}
            stripeConnected={!!(mosque as Record<string, unknown>).stripe_account_id}
          />
        )}
        {taskId === "ads_config" && (
          <BusinessAdsPanel mosqueId={mosque.id} initialConfig={adsConfig} />
        )}
        {taskId === "preview_app" && previewData && (
          <PreviewAppPanel data={previewData} />
        )}
        {taskId === "launch_materials" && (
          <LaunchMaterialsPanel mosque={{
            id: mosque.id,
            name: mosque.name,
            app_name: mosque.app_name,
            city: mosque.city,
            state: mosque.state,
          }} />
        )}
        {taskId === "go_live" && goLiveData && (
          <GoLivePanel data={goLiveData} />
        )}
      </div>

      {/* Prev/Next navigation */}
      <div className="mt-10 flex items-center justify-between gap-4 border-t border-stone-200 pt-6">
        {prevTask ? (
          <Link
            href={`/${prevTask.id}`}
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
          >
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            {prevTask.label}
          </Link>
        ) : (
          <div />
        )}

        {nextTask ? (
          <Link
            href={`/${nextTask.id}`}
            className="inline-flex items-center rounded-lg bg-dark-green px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-dark-green/90 hover:shadow-md"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-[13px] font-medium text-emerald-700">
            All tasks complete
          </span>
        )}
      </div>
    </div>
    </TaskPageTransition>
  );
}
