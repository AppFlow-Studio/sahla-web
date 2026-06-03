import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingSidebar from "./components/OnboardingSidebar";
import ToastProvider from "./components/ToastProvider";
import LeaveOnboardingBeacon from "./components/LeaveOnboardingBeacon";
import PageTransition from "@/app/components/PageTransition";
import OnboardingPreviewProvider from "./components/OnboardingPreviewContext";
import OnboardingPhonePreview from "./components/OnboardingPhonePreview";
import { getMosqueOnboardingData } from "./data";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

export default async function MasjidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const orgId = session.orgId;

  if (!orgId) {
    redirect("/onboarding");
  }

  const mosque = await getMosqueOnboardingData(orgId);

  // Once a mosque has paid (`ready`) or shipped (`live`), onboarding is a
  // closed chapter — bounce them into the CRM. HQ admins keep access so they
  // can QA the onboarding flow at any time.
  const isHQ = SAHLA_HQ_ORG_ID && orgId === SAHLA_HQ_ORG_ID;
  if (
    !isHQ &&
    (mosque?.onboarding_status === "ready" ||
      mosque?.onboarding_status === "live")
  ) {
    redirect("/home");
  }

  const mosqueName = mosque?.name || "Your Mosque";
  const progress = (mosque?.onboarding_progress as Record<string, boolean>) || {};

  const previewInitial = {
    appName: mosque?.app_name || mosque?.name || "Your Masjid",
    brandColor: mosque?.brand_color || "#0A261E",
    accentColor: mosque?.accent_color || "#B8922A",
    logoUrl: mosque?.logo_url || null,
  };

  return (
    <OnboardingPreviewProvider initial={previewInitial}>
      <div className="flex h-screen bg-[#fffbf2]">
        <LeaveOnboardingBeacon />
        <OnboardingSidebar mosqueName={mosqueName} progress={progress} />
        <main className="flex-1 overflow-y-auto p-8">
          <ToastProvider>
            <PageTransition>{children}</PageTransition>
          </ToastProvider>
        </main>
        <OnboardingPhonePreview />
      </div>
    </OnboardingPreviewProvider>
  );
}
