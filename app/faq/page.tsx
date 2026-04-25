import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import DemoContent from "../demo/DemoContent";
import BottomBar from "../components/BottomBar";
import FAQContent from "./FAQContent";

export const metadata: Metadata = {
  title: "FAQ — Sahla",
  description:
    "Answers to the most common questions mosque boards ask about Sahla: ownership, pricing, Apple Developer fees, data privacy, and more.",
};

export default function FAQPage() {
  return (
    <div className="relative">
      <Navbar />
      <FAQContent />
      <DemoContent />
      <BottomBar />
    </div>
  );
}
