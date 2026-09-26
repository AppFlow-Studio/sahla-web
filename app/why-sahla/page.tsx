import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";
import WhySahlaContent from "./WhySahlaContent";
import { BreadcrumbJsonLd } from "../components/JsonLd";

export const metadata: Metadata = {
  // absolute: the title already says "Sahla" once, so skip the layout's
  // "%s | Sahla" template instead of doubling it.
  title: { absolute: "Why Sahla — Standalone White-Label Mosque Apps" },
  description:
    "Most mosque platforms put your masjid inside their app. Sahla builds your app — under your mosque's name, with your branding, in the App Store as a real, separate listing.",
};

export default function WhySahlaPage() {
  return (
    <div className="relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://sahla.co/" },
          { name: "Why Sahla", url: "https://sahla.co/why-sahla" },
        ]}
      />
      <Navbar />
      <WhySahlaContent />
      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
