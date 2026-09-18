import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import GlobalContent from "./GlobalContent";
import { BreadcrumbJsonLd } from "../components/JsonLd";

export const metadata: Metadata = {
  title: "Mosque Apps Worldwide",
  description:
    "From New York to Dubai, London to Tokyo — Sahla powers mosque communities across every continent. Every time zone, every currency, every language your community speaks.",
};

export default function GlobalPage() {
  return (
    <div className="relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://sahla.co/" },
          { name: "Global", url: "https://sahla.co/global" },
        ]}
      />
      <Navbar />
      <GlobalContent />
      <BottomBar />
    </div>
  );
}
