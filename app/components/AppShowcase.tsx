"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import PhoneCarousel from "./PhoneCarousel";

export default function AppShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-15%" });
  const [demoActive, setDemoActive] = useState(false);

  const openDemo = useCallback(() => setDemoActive(true), []);
  const closeDemo = useCallback(() => setDemoActive(false), []);

  useEffect(() => {
    if (!demoActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDemo();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [demoActive, closeDemo]);

  useEffect(() => {
    if (demoActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [demoActive]);

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24"
    >
      {/* Nebula glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 h-[100vh] w-[100vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(26,58,42,0.15) 0%, transparent 55%)",
          }}
        />
        <div
          className="absolute top-[50%] left-[20%] h-[50vh] w-[40vw] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(196,168,122,0.07) 0%, transparent 55%)",
          }}
        />
      </div>

      {/* Heading — fades out in demo mode */}
      <motion.div
        className="relative z-10 mb-16 overflow-hidden text-center"
        animate={demoActive ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ pointerEvents: demoActive ? "none" : "auto" }}
      >
        <motion.h2
          className="mb-4 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,4rem)] text-[#f0ebe3]"
          initial={{ y: "100%", opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Experience the App
        </motion.h2>
        <motion.p
          className="text-sm tracking-[0.15em] uppercase text-[#c4a87a]/50"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        >
          Swipe through different screens
        </motion.p>
      </motion.div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* About — fades out in demo mode */}
        <motion.div
          className="mb-10 max-w-xs px-4 text-center md:absolute md:top-1/2 md:-left-16 md:mb-0 md:-translate-y-1/2 md:px-0 md:text-left lg:-left-24"
          initial={{ opacity: 0, x: -40 }}
          animate={
            demoActive
              ? { opacity: 0, scale: 0.95, x: -40 }
              : isInView
                ? { opacity: 1, x: 0, scale: 1 }
                : {}
          }
          transition={{ duration: demoActive ? 0.4 : 0.8, ease: "easeOut", delay: demoActive ? 0 : 0.6 }}
          style={{ pointerEvents: demoActive ? "none" : "auto" }}
        >
          <h3 className="mb-4 font-[family-name:var(--font-display)] text-2xl text-[#f0ebe3]">
            Built for Communities
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-[#f0ebe3]/50">
            Sahla empowers community centers to create their own custom mobile
            apps without writing a single line of code. From event scheduling
            and member directories to real-time messaging and donation
            tracking — everything your community needs, designed in minutes.
          </p>
          <div className="flex flex-col gap-3">
            {[
              "Drag-and-drop app builder",
              "Real-time member engagement",
              "Events, calendars & notifications",
              "Secure messaging & groups",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4a8c65]/20">
                  <svg
                    className="h-3 w-3 text-[#4a8c65]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm text-[#d9c4a0]/70">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phone in normal flow — hidden when demo is active */}
        <motion.div
          className="flex justify-center"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
          initial={{ opacity: 0, rotateX: 45, y: 200, scale: 0.6 }}
          animate={
            demoActive
              ? { opacity: 0, scale: 0.8 }
              : isInView
                ? { opacity: 1, rotateX: 0, y: 0, scale: 1 }
                : {}
          }
          transition={
            demoActive
              ? { duration: 0.3, ease: "easeOut" }
              : {
                  duration: 1.4,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.15,
                  opacity: { duration: 0.8, delay: 0.15 },
                }
          }
        >
          <PhoneCarousel demoMode={false} />
        </motion.div>

        {/* Analytics — fades out in demo mode */}
        <motion.div
          className="mt-10 max-w-xs px-4 text-center md:absolute md:top-1/2 md:right-0 md:mt-0 md:-translate-y-1/2 md:px-0 md:text-left lg:-right-8"
          initial={{ opacity: 0, x: 40 }}
          animate={
            demoActive
              ? { opacity: 0, scale: 0.95, x: 40 }
              : isInView
                ? { opacity: 1, x: 0, scale: 1 }
                : {}
          }
          transition={{ duration: demoActive ? 0.4 : 0.8, ease: "easeOut", delay: demoActive ? 0 : 0.8 }}
          style={{ pointerEvents: demoActive ? "none" : "auto" }}
        >
          <h3 className="mb-5 font-[family-name:var(--font-display)] text-2xl text-[#f0ebe3]">
            Our Impact
          </h3>
          <div className="flex flex-col gap-5">
            {[
              { value: "50+", label: "Apps Launched", change: "+12 this quarter" },
              { value: "25K", label: "Active Users", change: "+34% growth" },
              { value: "98%", label: "Uptime", change: "Last 12 months" },
              { value: "4.8", label: "App Store Rating", change: "Avg across apps" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a3a2a]">
                  <span className="text-sm font-bold text-[#4a8c65]">
                    {stat.value}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#f0ebe3]/70">
                    {stat.label}
                  </p>
                  <p className="text-xs text-[#4a8c65]/60">{stat.change}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Buttons — fade out in demo mode */}
      <motion.div
        className="relative z-10 mt-12 flex gap-4"
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={
          demoActive
            ? { opacity: 0, scale: 0.9, y: 20 }
            : isInView
              ? { opacity: 1, y: 0, scale: 1 }
              : {}
        }
        transition={{
          duration: demoActive ? 0.3 : 0.8,
          ease: demoActive ? "easeOut" : [0.16, 1, 0.3, 1],
          delay: demoActive ? 0 : 1,
        }}
        style={{ pointerEvents: demoActive ? "none" : "auto" }}
      >
        <button className="group relative cursor-pointer overflow-hidden rounded-full bg-[#4a8c65] px-10 py-4 text-base font-medium tracking-wide text-[#f0ebe3] transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,140,101,0.4)]">
          <span className="relative z-10">Get Started</span>
          <div className="absolute inset-0 -translate-x-full bg-[#2d5a3d] transition-transform duration-300 group-hover:translate-x-0" />
        </button>
        <button
          onClick={openDemo}
          className="group relative cursor-pointer overflow-hidden rounded-full border border-[#d9c4a0]/40 px-10 py-4 text-base font-medium tracking-wide text-[#d9c4a0] transition-all duration-300 hover:border-[#d9c4a0]/60 hover:text-[#f0ebe3]"
        >
          <span className="relative z-10">Demo</span>
          <div className="absolute inset-0 -translate-x-full bg-[#d9c4a0]/10 transition-transform duration-300 group-hover:translate-x-0" />
        </button>
      </motion.div>

      {/* Demo mode overlay — rendered as fixed elements above everything */}
      <AnimatePresence>
        {demoActive && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={closeDemo}
            />

            {/* Demo phone — fixed centered, above backdrop */}
            <motion.div
              className="pointer-events-none fixed inset-0 z-[45] flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 18 }}
            >
              <div
                className="pointer-events-auto"
                style={{ transform: "scale(1.15)" }}
              >
                <PhoneCarousel demoMode={true} />
              </div>
            </motion.div>

            {/* Close button */}
            <motion.button
              className="fixed top-8 right-8 z-[60] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#f0ebe3]/20 bg-[#0a1410]/80 text-[#f0ebe3]/70 backdrop-blur-sm transition-colors hover:border-[#f0ebe3]/40 hover:text-[#f0ebe3]"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              onClick={closeDemo}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
