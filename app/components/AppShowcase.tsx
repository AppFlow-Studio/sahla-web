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
    duration: 8000,
    video: "https://sahla.b-cdn.net/HomePage.mov",
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
    duration: 3000,
    video: "https://sahla.b-cdn.net/Discover.mov",
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
    duration: 3000,
    video: "https://sahla.b-cdn.net/Reels.mov",
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
    duration: 3000,
    video: "https://sahla.b-cdn.net/PrayerTable.mov",
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
    duration: 3000,
    video: "https://sahla.b-cdn.net/Profile.mov",
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
  const [progress, setProgress] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const advanceToNext = useCallback(() => {
    setActive((prev) => (prev >= screens.length - 1 ? 0 : prev + 1));
  }, []);

  // Sync video playback, track progress via RAF, advance on end
  useEffect(() => {
    setProgress(0);
    cancelAnimationFrame(rafRef.current);

    videoRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === active) {
        el.currentTime = 0;
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });

    const activeVideo = videoRefs.current[active];
    if (!activeVideo) return;

    // RAF loop to read actual video progress
    const tick = () => {
      if (activeVideo.duration && isFinite(activeVideo.duration)) {
        setProgress(activeVideo.currentTime / activeVideo.duration);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onEnded = () => advanceToNext();
    activeVideo.addEventListener("ended", onEnded);

    return () => {
      cancelAnimationFrame(rafRef.current);
      activeVideo.removeEventListener("ended", onEnded);
    };
  }, [active, advanceToNext]);

  // 3D tilt on mouse move over phone panel
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = phoneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((i: number) => {
    setActive(i);
  }, []);

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
            App Showcase
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,60px)] text-sand">
            Experience the app.
          </h2>
          <p className="mx-auto mt-[18px] max-w-[520px] text-[15px] leading-[1.65] text-sand/70">
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
            <div
              ref={phoneRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative grid place-items-center bg-[#071a14] p-6 sm:p-12 lg:p-[72px_40px]"
              style={{ perspective: "900px" }}
            >
              {/* Pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
                  backgroundSize: "80px 80px",
                }}
              />

              {/* Halo — shifts with tilt */}
              <motion.div
                className="pointer-events-none absolute h-[500px] w-[500px] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(74,140,101,0.3), transparent 62%)", filter: "blur(40px)" }}
                animate={{ x: tilt.y * 3, y: tilt.x * 3 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              />

              {/* Phone with 3D tilt + scale pulse on tab change */}
              <motion.div
                className="relative"
                animate={{
                  rotateX: tilt.x,
                  rotateY: tilt.y,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  key={active}
                  initial={{ scale: 0.97 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <IPhoneMockup screenWidth={240} screenType="island" frameColor="#1a1a1a" statusbarColor="#0a1410" hideStatusBar hideNavBar>
                    <div className="relative h-full w-full bg-dark-green">
                      {screens.map((s, i) => (
                        <video
                          key={s.id}
                          src={s.video}
                          autoPlay={i === 0}
                          muted
                          playsInline
                          preload="auto"
                          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500"
                          style={{ opacity: i === active ? 1 : 0 }}
                          ref={(el) => { videoRefs.current[i] = el; }}
                        />
                      ))}
                    </div>
                  </IPhoneMockup>
                </motion.div>

                {/* Reflection / glow under phone */}
                <div
                  className="pointer-events-none absolute -bottom-8 left-1/2 h-16 w-[70%] -translate-x-1/2 rounded-full opacity-30"
                  style={{
                    background: "radial-gradient(ellipse, rgba(217,196,160,0.4), transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />
              </motion.div>
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
                  <p className="mb-8 max-w-[420px] text-[15px] leading-[1.7] text-sand/70">
                    {screen.sub}
                  </p>

                  <div className="flex flex-col gap-[18px]">
                    {screen.features.map((f, j) => (
                      <motion.div
                        key={f.text}
                        className="group flex items-center gap-4"
                        initial={{ opacity: 0, x: 16, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 + j * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <motion.div
                          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${f.accent}1F` }}
                          whileHover={{ scale: 1.12, rotate: 3 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <f.Icon size={20} strokeWidth={1.8} style={{ color: f.accent }} />
                        </motion.div>
                        <span className="text-[14px] font-medium text-sand/75">{f.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Tab progress bars — driven by actual video currentTime */}
              <div className="mt-10 flex gap-2">
                {screens.map((s, i) => {
                  const barWidth =
                    i < active ? 100 : i === active ? progress * 100 : 0;
                  return (
                    <button
                      key={s.id}
                      onClick={() => goTo(i)}
                      className="h-[3px] flex-1 cursor-pointer overflow-hidden rounded-full border-0 bg-sand/[0.06] p-0"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: barWidth > 0 ? "linear-gradient(90deg, #d9c4a0, #B8922A)" : "transparent",
                          width: `${barWidth}%`,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
