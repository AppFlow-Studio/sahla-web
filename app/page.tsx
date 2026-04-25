import type { Metadata } from "next";
import { SoftwareApplicationJsonLd } from "./components/JsonLd";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProofBar from "./components/ProofBar";
import ThreeProblems from "./components/ThreeProblems";
import HowItWorks from "./components/HowItWorks";
import AppShowcase from "./components/AppShowcase";
import Features from "./components/Features";
import RevenueFlip from "./components/RevenueFlip";
import BuiltForMosques from "./components/BuiltForMosques";
import FAQTeaser from "./components/FAQTeaser";
import CTASection from "./components/CTASection";
import BottomBar from "./components/BottomBar";

export const metadata: Metadata = {
  title: "Sahla — Your Mosque Deserves Its Own App",
  description:
    "Sahla builds fully branded iOS and Android apps for mosques. Your name in the App Store, your colors, your community. White-label mosque app builder with built-in donations, prayer times, and sponsor revenue.",
};

export default function Home() {
  return (
    <div className="relative">
      <SoftwareApplicationJsonLd />
      <Navbar />
      <Hero />
      <AppShowcase />
      <ProofBar />
      <ThreeProblems />
      <HowItWorks />
      <Features />
      <RevenueFlip />
      <BuiltForMosques />
      <FAQTeaser />
      <CTASection />
      <BottomBar />
    </div>
  );
}
