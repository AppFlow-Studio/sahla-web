import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import GlobalContent from "./GlobalContent";

export const metadata: Metadata = {
  title: "Global Outreach — Built in New York, Serving Masjids Worldwide | Sahla",
  description:
    "From New York to Dubai, London to Tokyo — Sahla powers mosque communities across every continent. Every time zone, every currency, every language your community speaks.",
};

export default function GlobalPage() {
  return (
    <div className="relative">
      <Navbar />
      <GlobalContent />
      <BottomBar />
    </div>
  );
}
