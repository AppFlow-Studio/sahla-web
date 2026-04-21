"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IPhoneMockup } from "react-device-mockup";
import {
  Clock, Heart, DollarSign, BookOpen, Play, User,
  Calendar, Building, Bell, Compass, Video, Palette,
  Sun, Moon, Shield, Sparkles, ChevronRight, Users,
} from "lucide-react";

const DURATION = 8000;

const screens = [
  {
    id: "home", label: "Home", Icon: Clock, poster: "/screens/home.png",
    headline: "Your Community, At a Glance",
    sub: "Prayer times, events, and donations — everything in one place.",
    features: [
      { Icon: Clock, text: "Live prayer countdown", accent: "#4a8c65" },
      { Icon: Calendar, text: "Today's events feed", accent: "#9a7b2e" },
      { Icon: DollarSign, text: "One-tap donations", accent: "#1a6b42" },
    ],
  },
  {
    id: "prayer", label: "Prayer", Icon: Bell, poster: "/screens/prayer-times.png",
    headline: "Prayer Times, Beautifully Clear",
    sub: "Adhan, iqamah, and Quran tracking — precision meets design.",
    features: [
      { Icon: Bell, text: "Smart adhan notifications", accent: "#4a8c65" },
      { Icon: Building, text: "Real-time iqamah sync", accent: "#1a6b42" },
      { Icon: BookOpen, text: "Quran progress tracker", accent: "#9a7b2e" },
    ],
  },
  {
    id: "discover", label: "Discover", Icon: Compass, poster: "/screens/discover.png",
    headline: "Discover Everything",
    sub: "Full Quran, 50+ programs, events — your community's catalog.",
    features: [
      { Icon: BookOpen, text: "114 surahs, searchable", accent: "#4a8c65" },
      { Icon: Users, text: "50+ programs to join", accent: "#1a6b42" },
      { Icon: Play, text: "Audio recitations", accent: "#9a7b2e" },
    ],
  },
  {
    id: "reels", label: "Reels", Icon: Video, poster: "/screens/discover.png",
    headline: "Islamic Reels",
    sub: "Short-form videos curated by your mosque — not an algorithm.",
    features: [
      { Icon: Video, text: "Mosque-curated content", accent: "#4a8c65" },
      { Icon: Sparkles, text: "Daily reminders", accent: "#9a7b2e" },
      { Icon: Heart, text: "Save & share", accent: "#dc2626" },
    ],
  },
  {
    id: "profile", label: "Profile", Icon: User, poster: "/screens/profile.png",
    headline: "Make It Yours",
    sub: "Dark mode, notification control, donation history — your way.",
    features: [
      { Icon: Moon, text: "Dark mode & themes", accent: "#0a261e" },
      { Icon: Shield, text: "Privacy controls", accent: "#1a6b42" },
      { Icon: Heart, text: "Donation history", accent: "#dc2626" },
    ],
  },
];

export default function AppShowcase() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const isPausedRef = useRef(false);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) setActive((p) => (p >= screens.length - 1 ? 0 : p + 1));
    }, DURATION);
  }, []);

  useEffect(() => { startTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [startTimer]);

  const goTo = useCallback((i: number) => { setActive(i); startTimer(); }, [startTimer]);

  const screen = screens[active];

  return (
    <section id="showcase" className="relative z-10 bg-[#fffbf2] py-32">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%230A261E' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative element above label */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, transparent, #B8922A60)" }} />
            <div className="h-1.5 w-1.5 rotate-45 bg-tan-gold/40" />
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, #B8922A60, transparent)" }} />
          </div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-tan-gold/60">App Showcase</p>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.5rem)] text-dark-green">
            Experience the App
          </h2>
        </motion.div>

        {/* Showcase card */}
        <motion.div
          className="relative overflow-hidden rounded-[28px] border border-dark-green/[0.04] bg-white shadow-2xl shadow-dark-green/[0.06]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle inner glow at top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent 10%, rgba(184,146,42,0.15) 50%, transparent 90%)" }} />

          <div className="flex flex-col lg:flex-row">
            {/* Phone side — dark background */}
            <div
              className="relative flex items-center justify-center overflow-hidden bg-dark-green p-12 lg:w-[45%] lg:p-16"
              onMouseEnter={() => { isPausedRef.current = true; }}
              onMouseLeave={() => { isPausedRef.current = false; }}
            >
              {/* Pattern inside phone section */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
                  backgroundSize: "80px 80px",
                }}
              />

              <div className="relative">
                <IPhoneMockup screenWidth={240} screenType="island" frameColor="#2a2a2a" statusbarColor="#f0ebe3" hideStatusBar hideNavBar>
                  <div className="relative h-full w-full bg-[#0a1410]">
                    {screens.map((s, i) => (
                      <img key={s.id} src={s.poster} alt={s.label}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                        style={{ opacity: i === active ? 1 : 0, transition: "opacity 0.6s ease" }}
                        draggable={false} />
                    ))}
                  </div>
                </IPhoneMockup>

                {/* Glow */}
                <div className="pointer-events-none absolute -inset-20 -z-10 rounded-full blur-[60px]" style={{ background: "radial-gradient(circle, rgba(74,140,101,0.25) 0%, transparent 60%)" }} />
              </div>
            </div>

            {/* Content side */}
            <div className="flex flex-1 flex-col justify-between p-8 lg:p-14">
              {/* Tabs */}
              <div className="mb-10 flex gap-1 overflow-x-auto">
                {screens.map((s, i) => {
                  const isActive = i === active;
                  const SIcon = s.Icon;
                  return (
                    <button key={s.id} onClick={() => goTo(i)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border-0 px-4 py-2.5 text-[13px] font-medium transition-all duration-300"
                      style={{
                        backgroundColor: isActive ? "rgba(26,107,66,0.08)" : "transparent",
                        color: isActive ? "#0a261e" : "rgba(10,38,30,0.3)",
                        boxShadow: isActive ? "0 0 0 1px rgba(26,107,66,0.1)" : "none",
                      }}
                    >
                      <SIcon size={15} />
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="min-h-[280px] flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={screen.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h3 className="mb-3 font-[family-name:var(--font-display)] text-[28px] text-dark-green lg:text-[34px]">
                      {screen.headline}
                    </h3>
                    <p className="mb-10 text-[14px] leading-relaxed text-dark-green/40">
                      {screen.sub}
                    </p>
                    <div className="flex flex-col gap-5">
                      {screen.features.map((f, j) => (
                        <motion.div
                          key={f.text}
                          className="group flex items-center gap-4"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.08 + j * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                            style={{ backgroundColor: `${f.accent}0D` }}
                          >
                            <f.Icon size={18} style={{ color: f.accent }} />
                          </div>
                          <span className="text-[14px] font-medium text-dark-green/55">{f.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress bar */}
              <div className="mt-10 flex gap-2">
                {screens.map((_, i) => (
                  <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-dark-green/[0.04]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: i <= active ? "linear-gradient(90deg, #1a6b42, #4a8c65)" : "transparent",
                        width: i === active ? "100%" : i < active ? "100%" : "0%",
                        transition: i === active ? `width ${DURATION}ms linear` : "width 0.3s ease",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
