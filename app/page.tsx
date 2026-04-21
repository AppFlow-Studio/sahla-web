import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LogoBar from "./components/LogoBar";
import Features from "./components/Features";
import AppShowcase from "./components/AppShowcase";
import CTASection from "./components/CTASection";
import BottomBar from "./components/BottomBar";

export default function Home() {

  return (
    <div className="relative">
      <Navbar />
      <Hero />
      <LogoBar />
      <AppShowcase />
      <Features />
      <CTASection />
      <BottomBar />
    </div>
  );
}
