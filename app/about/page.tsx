import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";
import AboutContent from "./AboutContent";
import { BreadcrumbJsonLd } from "../components/JsonLd";

export const metadata: Metadata = {
  title: "About",
  description:
    "Sahla was born from a simple frustration: not knowing what's happening at my own mosque. Meet the team building the future of mosque technology.",
};

export default function AboutPage() {
  return (
    <div className="relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://sahla.co/" },
          { name: "About", url: "https://sahla.co/about" },
        ]}
      />
      <Navbar />
      <AboutContent />
      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
