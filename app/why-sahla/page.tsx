import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";
import WhySahlaContent from "./WhySahlaContent";

export const metadata: Metadata = {
  title: "Why Sahla — White-Label Standalone Mosque App",
  description:
    "Most mosque platforms put your masjid inside their app. Sahla builds your app — under your mosque's name, with your branding, in the App Store as a real, separate listing.",
};

export default function WhySahlaPage() {
  return (
    <div className="relative">
      <Navbar />
      <WhySahlaContent />
      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
