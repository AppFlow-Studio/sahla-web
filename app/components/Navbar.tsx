"use client";

import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Thin gold accent line at very top */}
      <div className="fixed top-0 right-0 left-0 z-[60] h-[2px]" style={{ background: "linear-gradient(90deg, transparent 0%, #B8922A 30%, #d4af37 50%, #B8922A 70%, transparent 100%)" }} />

      <motion.nav
        className="fixed top-[2px] right-0 left-0 z-50 transition-all duration-700"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{
          backgroundColor: scrolled ? "rgba(10, 38, 30, 0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,251,242,0.06)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo mark */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-accent to-emerald-700 transition-transform duration-300 group-hover:scale-105">
              <span className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>S</span>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-white/10" />
            </div>
            <span className="font-[family-name:var(--font-display)] text-xl tracking-wide text-white">
              Sahla
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-10 md:flex">
            <a href="#showcase" className="relative text-[13px] font-medium tracking-wide text-white/50 transition-colors duration-300 hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="relative text-[13px] font-medium tracking-wide text-white/50 transition-colors duration-300 hover:text-white">
              How It Works
            </a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {!isLoaded ? null : isSignedIn ? (
              <>
                <Link href="/launch" className="rounded-full bg-gradient-to-r from-white to-white/95 px-6 py-2.5 text-[13px] font-semibold text-dark-green shadow-lg shadow-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-white/15">
                  Open App
                </Link>
                <button onClick={() => signOut({ redirectUrl: "/" })} className="rounded-full border border-white/15 px-5 py-2.5 text-[13px] font-medium text-white/70 transition-all duration-300 hover:border-white/25 hover:bg-white/5 hover:text-white">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[13px] font-medium text-white/50 transition-colors duration-300 hover:text-white">
                  Log In
                </Link>
                <Link href="/login" className="group relative overflow-hidden rounded-full bg-white px-6 py-2.5 text-[13px] font-semibold text-dark-green transition-all duration-300 hover:shadow-lg hover:shadow-white/15">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
