import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Starfield from "./components/Starfield";

import ScrollCTA from "./components/ScrollCTA";
import AppShowcase from "./components/AppShowcase";
import BottomBar from "./components/BottomBar";

export default function Home() {
  return (
    <div className="relative bg-[#040a07]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <Starfield />
        {/* Nebula glow layers — soft gradients, no blur filter */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div
            className="absolute top-1/2 left-1/2 h-[120vh] w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(26,58,42,0.2) 0%, rgba(13,31,21,0.1) 30%, transparent 60%)",
            }}
          />
          <div
            className="absolute top-[20%] left-[10%] h-[60vh] w-[50vw] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(196,168,122,0.08) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute right-[5%] bottom-[10%] h-[50vh] w-[40vw] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(45,90,61,0.08) 0%, transparent 60%)",
            }}
          />
        </div>

        <Hero />
        <ScrollCTA />
      </section>

      {/* App Showcase Section */}
      <AppShowcase />

      {/* Footer */}
      <BottomBar />
    </div>
  );
}
