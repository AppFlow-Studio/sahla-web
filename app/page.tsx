"use client";

import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ScrollCTA from "./components/ScrollCTA";
import AppShowcase from "./components/AppShowcase";
import BottomBar from "./components/BottomBar";

const drift = (x: number, y: number, duration: number) => ({
  animate: { x: [0, x, -x * 0.6, 0], y: [0, -y, y * 0.8, 0] },
  transition: { duration, repeat: Infinity, ease: "easeInOut" },
});

export default function Home() {
  return (
    <div className="relative bg-night">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Soft gradient orbs */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            className="absolute -top-[20%] -right-[10%] h-[70vh] w-[60vw] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(26,107,66,0.08) 0%, transparent 60%)",
            }}
            {...drift(25, 20, 22)}
          />
          <motion.div
            className="absolute -bottom-[10%] -left-[15%] h-[60vh] w-[50vw] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(184,146,42,0.06) 0%, transparent 60%)",
            }}
            {...drift(-20, 25, 26)}
          />
          <motion.div
            className="absolute top-[30%] left-[40%] h-[40vh] w-[40vw] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(26,107,66,0.04) 0%, transparent 50%)",
            }}
            {...drift(15, -18, 30)}
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
