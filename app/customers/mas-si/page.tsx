import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import WaitlistContent from "../../waitlist/WaitlistContent";
import BottomBar from "../../components/BottomBar";
import CaseStudyContent from "./CaseStudyContent";
import { BreadcrumbJsonLd } from "../../components/JsonLd";

export const metadata: Metadata = {
  title: "MAS Staten Island Case Study",
  description:
    "How MAS Staten Island launched their own branded mosque app with Sahla, reaching 3,000+ active users with prayer times, donations, and community programs.",
};

export default function CaseStudyPage() {
  return (
    <div className="relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://sahla.co/" },
          {
            name: "MAS Staten Island Case Study",
            url: "https://sahla.co/customers/mas-si",
          },
        ]}
      />
      <Navbar />
      <CaseStudyContent />
      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
