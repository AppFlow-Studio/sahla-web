import type { Metadata } from "next";
import CrmShell from "./_components/CrmShell";

export const metadata: Metadata = {
  title: "Mosque CRM",
  description:
    "Run your mosque — members, events, donations, prayer times, and more.",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <CrmShell>{children}</CrmShell>;
}
