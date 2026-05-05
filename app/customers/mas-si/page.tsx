import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import WaitlistContent from "../../waitlist/WaitlistContent";
import BottomBar from "../../components/BottomBar";
import CaseStudyContent from "./CaseStudyContent";

export const metadata: Metadata = {
  title: "MAS Staten Island — Sahla Case Study",
  description:
    "How MAS Staten Island launched their own branded mosque app with Sahla, reaching 3,000+ active users with prayer times, donations, and community programs.",
};

export default function CaseStudyPage() {
  return (
    <div className="relative">
      <Navbar />
      <CaseStudyContent />
      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
