import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingSidebar from "./components/OnboardingSidebar";
import ToastProvider from "./components/ToastProvider";
import PageTransition from "@/app/components/PageTransition";
import { getMosqueOnboardingData } from "./data";

export default async function MasjidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const orgId = session.orgId;

  if (!orgId) {
    // Proxy already guards this, but just in case:
    redirect("/select-org");
  }

  const mosque = await getMosqueOnboardingData(orgId);

  const mosqueName = mosque?.name || "Your Mosque";
  const progress = (mosque?.onboarding_progress as Record<string, boolean>) || {};
  const subscriptionStatus = mosque?.subscription_status as string | null;

  return (
    <div className="flex h-screen bg-[#fffbf2]">
      <OnboardingSidebar mosqueName={mosqueName} progress={progress} />
      <main className="flex-1 overflow-y-auto">
        {subscriptionStatus === "past_due" && (
          <div className="border-b border-amber-200 bg-amber-50 px-8 py-3">
            <p className="text-[13px] text-amber-800">
              <span className="font-semibold">Payment failed.</span>{" "}
              Your last payment was unsuccessful. Please update your payment method to avoid service interruption.
            </p>
          </div>
        )}
        {subscriptionStatus === "canceled" && (
          <div className="border-b border-red-200 bg-red-50 px-8 py-3">
            <p className="text-[13px] text-red-800">
              <span className="font-semibold">Subscription canceled.</span>{" "}
              Your subscription has been canceled. Contact your admin to reinstate service.
            </p>
          </div>
        )}
        <div className="p-8">
          <ToastProvider>
            <PageTransition>{children}</PageTransition>
          </ToastProvider>
        </div>
      </main>
    </div>
  );
}
