"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IPhoneMockup } from "react-device-mockup";
import {
  Clock, Heart, DollarSign, BookOpen, Play, User,
  Calendar, Building, Bell, Compass, Video,
  Moon, Shield, Sparkles, Users,
} from "lucide-react";

const screens = [
  {
    id: "home", label: "Home", Icon: Clock,
    duration: 12000,
    headline: "Your community,",
    headlineEm: "at a glance.",
    sub: "Prayer times, today\u2019s events, and donation campaigns \u2014 in one calm feed. Members open the app for one thing and stay for another.",
    features: [
      { Icon: Clock, text: "Live prayer countdown", accent: "#4a8c65" },
      { Icon: Calendar, text: "Today\u2019s events feed", accent: "#9a7b2e" },
      { Icon: DollarSign, text: "One-tap donations", accent: "#1a6b42" },
    ],
  },
  {
    id: "discover", label: "Discover", Icon: Compass,
    duration: 6000,
    headline: "Discover",
    headlineEm: "everything.",
    sub: "Full Quran, 50+ programs, events \u2014 your community\u2019s catalog.",
    features: [
      { Icon: BookOpen, text: "114 surahs, searchable", accent: "#4a8c65" },
      { Icon: Users, text: "50+ programs to join", accent: "#1a6b42" },
      { Icon: Play, text: "Audio recitations", accent: "#9a7b2e" },
    ],
  },
  {
    id: "watch", label: "Watch", Icon: Video,
    duration: 5000,
    headline: "Islamic",
    headlineEm: "reels.",
    sub: "Short-form videos curated by your mosque \u2014 not an algorithm.",
    features: [
      { Icon: Video, text: "Mosque-curated content", accent: "#4a8c65" },
      { Icon: Sparkles, text: "Daily reminders", accent: "#9a7b2e" },
      { Icon: Heart, text: "Save & share", accent: "#dc2626" },
    ],
  },
  {
    id: "prayer", label: "Prayer / Quran", Icon: Bell,
    duration: 22000,
    headline: "Prayer times,",
    headlineEm: "beautifully clear.",
    sub: "Adhan, iqamah, and Quran tracking \u2014 precision meets design.",
    features: [
      { Icon: Bell, text: "Smart adhan notifications", accent: "#4a8c65" },
      { Icon: Building, text: "Real-time iqamah sync", accent: "#1a6b42" },
      { Icon: BookOpen, text: "Quran progress tracker", accent: "#9a7b2e" },
    ],
  },
  {
    id: "profile", label: "Profile", Icon: User,
    duration: 6000,
    headline: "Make it",
    headlineEm: "yours.",
    sub: "Dark mode, notification control, donation history \u2014 your way.",
    features: [
      { Icon: Moon, text: "Dark mode & themes", accent: "#0a261e" },
      { Icon: Shield, text: "Privacy controls", accent: "#1a6b42" },
      { Icon: Heart, text: "Donation history", accent: "#dc2626" },
    ],
  },
];

export default function AppShowcase() {
  const [active, setActive] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const scheduleNext = useCallback((index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const next = index >= screens.length - 1 ? 0 : index + 1;
      setActive(next);
      setProgressKey((k) => k + 1);
      scheduleNext(next);
    }, screens[index].duration);
  }, []);

  useEffect(() => {
    scheduleNext(0);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleNext]);

  const goTo = useCallback((i: number) => {
    setActive(i);
    setProgressKey((k) => k + 1);
    scheduleNext(i);
  }, [scheduleNext]);

  const screen = screens[active];

  return (
    <section id="showcase" className="relative overflow-hidden bg-dark-green py-16 sm:py-[120px]">
      {/* Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Section header */}
        <motion.div
          className="mb-10 text-center sm:mb-[72px]"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Diamond divider */}
          <div className="mb-5 flex items-center justify-center gap-3.5">
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(217,196,160,0.5))" }} />
            <div className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, rgba(217,196,160,0.5), transparent)" }} />
          </div>
          <p className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_12px_#B8922A]" />
            App Showcase
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,60px)] text-sand">
            Experience the app.
          </h2>
          <p className="mx-auto mt-[18px] max-w-[520px] text-[15px] leading-[1.65] text-sand/45">
            One tap to prayer times, events and donations &mdash; wrapped in your masjid&rsquo;s brand.
          </p>
        </motion.div>

        {/* Showcase card */}
        <motion.div
          className="relative overflow-hidden rounded-[28px] border border-[#d9c4a0]/10 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.6)]"
          style={{ background: "linear-gradient(180deg, #0e2b22, #071a14)" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
        >
          {/* Top accent line */}
          <div className="pointer-events-none absolute inset-x-[10%] top-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(217,196,160,0.3), transparent)" }} />

          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr]">
            {/* Phone panel */}
            <div className="relative grid place-items-center bg-[#071a14] p-6 sm:p-12 lg:p-[72px_40px]">
              {/* Pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
                  backgroundSize: "80px 80px",
                }}
              />

              {/* Halo */}
              <div className="pointer-events-none absolute h-[500px] w-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(74,140,101,0.3), transparent 62%)", filter: "blur(40px)" }} />

              <div className="relative">
                <IPhoneMockup screenWidth={240} screenType="island" frameColor="#1a1a1a" statusbarColor="#0a1410" hideStatusBar hideNavBar>
                  <div className="relative h-full w-full bg-dark-green">
                    {/* TODO: re-enable after compressing app-demo.mov with ffmpeg */}
                    {/* <video
                      src="/screens/app-demo.mov"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      onEnded={(e) => {
                        const v = e.currentTarget;
                        v.currentTime = 0;
                        v.play();
                      }}
                      onPause={(e) => {
                        const v = e.currentTarget;
                        if (v.currentTime >= v.duration - 0.5 || v.ended) {
                          v.currentTime = 0;
                          v.play();
                        }
                      }}
                    /> */}
                  </div>
                </IPhoneMockup>
              </div>
            </div>

            {/* Content side */}
            <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-14">
              <AnimatePresence mode="wait">
                <motion.div
                  key={screen.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Eyebrow */}
                  <div className="mb-3.5 inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_12px_#B8922A]" />
                    {screen.label}
                  </div>

                  <h3 className="mb-[18px] max-w-[400px] font-[family-name:var(--font-display)] text-[28px] leading-[1.06] text-sand sm:text-[36px] lg:text-[44px]">
                    {screen.headline}<br />
                    <em className="text-[#d9c4a0]">{screen.headlineEm}</em>
                  </h3>
                  <p className="mb-8 max-w-[420px] text-[15px] leading-[1.7] text-sand/50">
                    {screen.sub}
                  </p>

                  <div className="flex flex-col gap-[18px]">
                    {screen.features.map((f, j) => (
                      <motion.div
                        key={f.text}
                        className="group flex items-center gap-4"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.08 + j * 0.06 }}
                      >
                        <div
                          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-[1.08]"
                          style={{ backgroundColor: `${f.accent}1F` }}
                        >
                          <f.Icon size={20} strokeWidth={1.8} style={{ color: f.accent }} />
                        </div>
                        <span className="text-[14px] font-medium text-sand/75">{f.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Tab progress bars — each with its own duration */}
              <div className="mt-10 flex gap-2">
                {screens.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => goTo(i)}
                    className="h-[3px] flex-1 cursor-pointer overflow-hidden rounded-full border-0 bg-sand/[0.06] p-0"
                  >
                    <div
                      key={i === active ? `${i}-${progressKey}` : `${i}-idle`}
                      className="h-full rounded-full"
                      style={{
                        background: i <= active ? "linear-gradient(90deg, #d9c4a0, #B8922A)" : "transparent",
                        width: i < active ? "100%" : i === active ? "100%" : "0%",
                        transition: i === active
                          ? `width ${s.duration}ms linear`
                          : "width 0.3s ease",
                        ...(i === active ? { width: "0%" } : {}),
                      }}
                      ref={(el) => {
                        // Force reflow to restart CSS transition for active tab
                        if (el && i === active) {
                          void el.offsetWidth;
                          el.style.width = "100%";
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
