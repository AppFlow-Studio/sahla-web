import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingSidebar from "./components/OnboardingSidebar";
import { getMosqueOnboardingData } from "./data";

export default async function MasjidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const orgId = session.orgId;

  if (!orgId) {
    redirect("/select-org");
  }

  const mosque = await getMosqueOnboardingData(orgId);

  const mosqueName = mosque?.name || "Your Mosque";
  const progress = (mosque?.onboarding_progress as Record<string, boolean>) || {};

  return (
    <div className="flex h-screen bg-[#F5F4F0]">
      <OnboardingSidebar mosqueName={mosqueName} progress={progress} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
