import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About Sahla — Built by Muslims, for Masjids",
  description:
    "Sahla was born from a simple frustration: not knowing what's happening at my own mosque. Meet the team building the future of mosque technology.",
};

export default function AboutPage() {
  return (
    <div className="relative">
      <Navbar />
      <AboutContent />
      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
