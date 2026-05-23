import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CrmShell from "./_components/CrmShell";
import { getCurrentMosque } from "./_lib/getCurrentMosque";

export const metadata: Metadata = {
  title: "Mosque CRM",
  description:
    "Run your mosque — members, events, donations, prayer times, and more.",
};

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getCurrentMosque();

  switch (result.kind) {
    case "no-auth":
      // Proxy should already catch this, but belt-and-suspenders.
      redirect("/login");
    case "no-mosque":
      // Signed in but no mosque row → either select-org or finish onboarding.
      redirect("/onboarding");
    case "no-access":
      // Signed in, mosque exists, but plan doesn't include CRM.
      redirect("/no-crm-access");
    case "ok":
      return <CrmShell mosque={result.mosque}>{children}</CrmShell>;
  }
}
