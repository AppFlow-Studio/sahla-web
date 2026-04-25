import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import DemoContent from "./DemoContent";

export const metadata: Metadata = {
  title: "Book a Demo — Sahla",
  description:
    "Schedule a 15-minute demo with the Sahla team. We'll walk you through how your mosque can launch its own branded app in the App Store.",
};

export default function DemoPage() {
  return (
    <div className="relative">
      <Navbar />
      <DemoContent />
      <BottomBar />
    </div>
  );
}
