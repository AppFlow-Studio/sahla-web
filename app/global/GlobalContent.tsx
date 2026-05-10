"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Clock,
  Globe,
  Languages,
  CreditCard,
  Users,
  Bell,
  Heart,
  Shield,
  Smartphone,
  Palette,
  DollarSign,
  Check,
  X,
  ArrowRight,
  MapPin,
  Banknote,
  MessageSquare,
} from "lucide-react";

const VisibilityGlobe = dynamic(() => import("../components/VisibilityGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1a6b42]/20 border-t-[#1a6b42]/60" />
    </div>
  ),
});

/* ─── Animated Counter ─── */
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = value;
    const duration = 2000;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * end);
      setCount(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ─── Section Divider ─── */
function Divider({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3.5 py-2">
      <div
        className="h-[1px] w-16"
        style={{
          background: light
            ? "linear-gradient(90deg, transparent, rgba(217,196,160,0.5))"
            : "linear-gradient(90deg, transparent, rgba(10,38,30,0.12))",
        }}
      />
      <div
        className="h-1.5 w-1.5 rotate-45"
        style={{ backgroundColor: light ? "#d4af37" : "#B8922A" }}
      />
      <div
        className="h-[1px] w-16"
        style={{
          background: light
            ? "linear-gradient(90deg, rgba(217,196,160,0.5), transparent)"
            : "linear-gradient(90deg, rgba(10,38,30,0.12), transparent)",
        }}
      />
    </div>
  );
}

/* ─── Data ─── */
const heroStats = [
  { value: 14, suffix: "+", label: "Prayer calc methods" },
  { value: 135, suffix: "+", label: "Currencies supported" },
  { value: 24, suffix: "/7", label: "Every timezone" },
  { value: 47, suffix: "K+", label: "Notifications sent" },
];

const pillars = [
  {
    num: "01",
    Icon: MapPin,
    title: "Time zones & prayer times",
    body: "Your masjid's address feeds into all 14 standard calculation methods \u2014 ISNA, MWL, Karachi, Umm al-Qura, Diyanet, and the rest. Athan and iqamah times are calculated daily for your location, and adjust automatically through every season, every DST shift, and every Ramadan.",
    accent: "#1a6b42",
  },
  {
    num: "02",
    Icon: Banknote,
    title: "Donations in your currency",
    body: "Members donate in their local currency. Your masjid's own Stripe account accepts 135+ currencies \u2014 GBP, CAD, AUD, ZAR, AED, SGD, EUR, MYR, and the rest. The receipt members get says your masjid's name, in their currency. Sahla never touches the funds.",
    accent: "#B8922A",
  },
  {
    num: "03",
    Icon: MessageSquare,
    title: "Language that fits your community",
    body: "The app's interface is English today, with Arabic religious vocabulary native throughout \u2014 Sadaqah, Zakat, Jummah, Taraweeh, never translated away. Multi-language UI (Urdu, Bengali, Arabic, Malay) is on our 2026 roadmap.",
    accent: "#1a6b42",
  },
];

const comparisonRows = [
  { feature: "App in the App Store", shared: "Their name", sahla: "Your masjid's name" },
  { feature: "Push notifications", shared: "Filtered through their brand", sahla: "Direct from your masjid" },
  { feature: "Donations", shared: "Their account \u00b7 their currency", sahla: "Your Stripe \u00b7 135+ currencies" },
  { feature: "Time zones / calc methods", shared: "Often US-defaulted", sahla: "All 14 methods \u00b7 per-mosque address" },
  { feature: "Branding", shared: "Limited to themes", sahla: "Full design control" },
  { feature: "Funding model", shared: "Subscription only", sahla: "Local sponsor offset" },
  { feature: "Built by", shared: "Generalist dev shops", sahla: "Muslims, for masjids" },
];

const features = [
  {
    Icon: Clock,
    title: "Prayer Times & Iqamah",
    desc: "Five prayers daily, calculated using the method your masjid uses \u2014 ISNA, MWL, Karachi, Umm al-Qura, Diyanet, or any of fourteen standards.",
  },
  {
    Icon: Users,
    title: "Programs, Events & Lectures",
    desc: "Halaqa schedules. Jummah info with the imam's name and topic. Past lectures and recordings. Registration for paid programs handled inside the app.",
  },
  {
    Icon: Heart,
    title: "Donations",
    desc: "Members donate through your own Stripe account, in their local currency. Sadaqah, Zakat, project-specific giving. Sahla never touches the funds.",
  },
  {
    Icon: Bell,
    title: "Push Notifications",
    desc: "Send a Jummah update. Schedule Ramadan reminders. Reach every member who has the app \u2014 by name, on their lock screen.",
  },
];

export default function GlobalContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.95]);

  return (
    <>
      {/* ═══════════ HERO — Full-screen globe ═══════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen overflow-hidden bg-[#fffbf2]"
      >
        {/* Subtle pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%230A261E' stroke-width='0.5'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%230A261E' stroke-width='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        <motion.div
          className="relative mx-auto max-w-[1400px] px-5 sm:px-8"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Text content — overlaid on top */}
          <div className="relative z-10 pt-32 sm:pt-40">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mb-5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#B8922A]">
                Built in New York &middot; Serving Masjids Worldwide
              </p>

              <h1 className="mx-auto max-w-[800px] font-[family-name:var(--font-display)] text-[clamp(36px,5.5vw,72px)] leading-[1.05] text-dark-green">
                From New York.{" "}
                <em className="text-[#1a6b42]">To your masjid,</em>{" "}
                wherever it is.
              </h1>

              <p className="mx-auto mt-6 max-w-[560px] text-[16px] leading-[1.7] text-dark-green/55">
                We&apos;re a New York-based team. The first masjid we built for
                is in Staten Island. The masjids we&apos;re building for next
                are in Birmingham, Brisbane, Toronto, Cape Town, and Dubai.
              </p>
            </motion.div>
          </div>

          {/* Globe — large and centered */}
          <motion.div
            className="relative z-0 mx-auto -mt-8 w-full max-w-[750px]"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            {/* Radial glow behind globe */}
            <div className="pointer-events-none absolute inset-0 -m-16 rounded-full bg-[radial-gradient(circle,rgba(26,107,66,0.1)_0%,transparent_65%)]" />
            <Suspense>
              <VisibilityGlobe />
            </Suspense>
          </motion.div>

          {/* Stat counters — floating below globe */}
          <motion.div
            className="relative z-10 mx-auto -mt-12 mb-16 grid max-w-[900px] grid-cols-2 gap-4 sm:mb-20 sm:grid-cols-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          >
            {heroStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-dark-green/[0.06] bg-white/80 px-5 py-5 text-center backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(10,38,30,0.08)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <div className="font-[family-name:var(--font-display)] text-[clamp(28px,3vw,40px)] leading-none text-dark-green">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark-green/40">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════ WHAT'S INSIDE — 4-feature grid ═══════════ */}
      <section className="relative overflow-hidden bg-dark-green py-20 sm:py-[100px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Divider light />
            <p className="mb-4 mt-5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">
              What&apos;s Inside
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,52px)] text-sand">
              Everything your masjid runs, in one place.
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-sand/[0.06] p-7 transition-all duration-500 hover:border-sand/[0.12] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
                style={{
                  background: "linear-gradient(180deg, rgba(255,251,242,0.04), rgba(255,251,242,0.01))",
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a6b42]/20">
                  <f.Icon size={24} strokeWidth={1.7} className="text-[#4a8c65]" />
                </div>
                <h3 className="mb-2 text-[18px] font-semibold text-sand">{f.title}</h3>
                <p className="text-[14px] leading-[1.7] text-sand/55">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ THREE PILLARS — Built for every masjid ═══════════ */}
      <section className="relative overflow-hidden bg-[#fffbf2] py-20 sm:py-[100px]">
        <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Divider />
            <p className="mb-4 mt-5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#B8922A]">
              Built for Every Masjid, Anywhere
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,52px)] text-dark-green">
              Three things travel with us &mdash; every time.
            </h2>
            <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-[1.7] text-dark-green/50">
              We&apos;re a New York-based team. The first masjid we built for is in Staten Island. The masjids we&apos;re building for next are across the globe.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {pillars.map((p, i) => (
              <motion.div
                key={p.num}
                className="group relative overflow-hidden rounded-2xl border border-dark-green/[0.06] bg-white p-8 transition-all duration-500 hover:shadow-[0_12px_48px_rgba(10,38,30,0.08)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Accent bar top */}
                <div
                  className="absolute inset-x-0 top-0 h-[3px] opacity-70"
                  style={{ background: `linear-gradient(90deg, ${p.accent}, transparent)` }}
                />

                <div className="mb-5 flex items-center gap-4">
                  <span className="font-[family-name:var(--font-display)] text-[48px] leading-none text-dark-green/10">
                    {p.num}
                  </span>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${p.accent}18` }}
                  >
                    <p.Icon size={20} strokeWidth={1.7} style={{ color: p.accent }} />
                  </div>
                </div>

                <h3 className="mb-3 text-[18px] font-semibold text-dark-green">
                  {p.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-dark-green/50">
                  {p.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      <section className="relative overflow-hidden bg-dark-green py-20 sm:py-[100px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative mx-auto max-w-[1000px] px-5 sm:px-8">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Divider light />
            <p className="mb-4 mt-5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">
              Standalone vs. Shared
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,52px)] text-sand">
              Why standalone matters.
            </h2>
            <p className="mx-auto mt-5 max-w-[500px] text-[15px] leading-[1.7] text-sand/55">
              Most masjid app platforms put your masjid inside their app. Sahla doesn&apos;t. Here&apos;s what that changes.
            </p>
          </motion.div>

          <motion.div
            className="overflow-hidden rounded-2xl border border-sand/[0.08]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-dark-green border-b border-sand/[0.08]">
              <div className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-sand/40">
                Feature
              </div>
              <div className="border-l border-sand/[0.06] px-5 py-4 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-sand/40">
                Shared platforms
              </div>
              <div className="border-l border-sand/[0.06] px-5 py-4 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#d9c4a0]">
                Sahla
              </div>
            </div>

            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <motion.div
                key={row.feature}
                className="grid grid-cols-[1fr_1fr_1fr] border-b border-sand/[0.04] last:border-b-0 transition-colors duration-200 hover:bg-sand/[0.02]"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <div className="px-5 py-4 text-[14px] font-medium text-sand/70">
                  {row.feature}
                </div>
                <div className="flex items-center justify-center gap-2 border-l border-sand/[0.06] px-5 py-4 text-center text-[13px] text-sand/35">
                  <X size={14} className="shrink-0 text-red-400/60" />
                  <span>{row.shared}</span>
                </div>
                <div className="flex items-center justify-center gap-2 border-l border-sand/[0.06] px-5 py-4 text-center text-[13px] text-sand/80">
                  <Check size={14} className="shrink-0 text-[#4a8c65]" />
                  <span>{row.sahla}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#d9c4a0] transition-colors hover:text-white"
            >
              See full pricing
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ BUILT BY MUSLIMS ═══════════ */}
      <section className="relative overflow-hidden bg-[#fffbf2] py-20 sm:py-[100px]">
        <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Divider />
              <p className="mb-4 mt-5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#B8922A]">
                Who Builds It
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] leading-[1.1] text-dark-green">
                Built by people who pray in mosques.
              </h2>

              <div className="mt-6 space-y-5 text-[15px] leading-[1.75] text-dark-green/55">
                <p>
                  We don&apos;t write Ramadan as a &ldquo;religious holiday.&rdquo; We don&apos;t call your imam a &ldquo;stakeholder.&rdquo; We don&apos;t bury Sadaqah inside a generic &ldquo;donate&rdquo; button.
                </p>
                <p>
                  Sahla is built by a Muslim team in New York for masjids everywhere. Our reference masjid &mdash; MAS Staten Island, 3,000+ members &mdash; has been running on what we built for two years. Every Jummah, every Taraweeh, every iftar, every halaqa: ours has been in their members&apos; pockets.
                </p>
                <p className="text-dark-green/70 font-medium">
                  When you talk to us, you&apos;re talking to people who know what it means when Maghrib jumps eleven minutes between Friday and Saturday in late October.
                </p>
              </div>
            </motion.div>

            {/* Visual — decorative card with Islamic pattern */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <div className="overflow-hidden rounded-3xl border border-dark-green/[0.06] bg-dark-green p-10 sm:p-14">
                {/* Pattern overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
                    backgroundSize: "80px 80px",
                  }}
                />

                <div className="relative space-y-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a6b42]/20">
                    <Shield size={32} strokeWidth={1.5} className="text-[#4a8c65]" />
                  </div>

                  <blockquote className="font-[family-name:var(--font-display)] text-[clamp(20px,2.5vw,28px)] leading-[1.3] text-sand">
                    &ldquo;Build with what you&apos;ve been given, for the people you&apos;ve been given to.&rdquo;
                  </blockquote>

                  <div className="mx-auto h-[1px] w-16 bg-sand/10" />

                  <div className="space-y-1">
                    <p className="text-[13px] font-semibold text-[#d9c4a0]">
                      The Sahla Team
                    </p>
                    <p className="text-[12px] text-sand/40">
                      New York &middot; 2026
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="relative overflow-hidden bg-dark-green py-20 sm:py-[100px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Divider light />
            <p className="mb-4 mt-5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">
              How It Works
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,52px)] text-sand">
              From conversation to App Store in three weeks.
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                num: "01",
                title: "Walkthrough",
                body: "A 20-minute call, scheduled in your time zone. We show you what your masjid's app would look like, answer questions, and confirm fit. No deck, no pitch \u2014 just a conversation.",
              },
              {
                num: "02",
                title: "Onboarding",
                body: "Fourteen short steps in our admin portal \u2014 branding, prayer times, sponsors, Stripe in your country. Most steps take under 30 minutes. We're with you through every one.",
              },
              {
                num: "03",
                title: "Launch",
                body: "Your app is submitted to the App Store and Google Play under your masjid's name. Once approved (typically 7\u201314 days), you announce it to your community.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                className="group relative overflow-hidden rounded-2xl border border-sand/[0.06] p-8 transition-all duration-500 hover:border-sand/[0.12]"
                style={{
                  background: "linear-gradient(180deg, rgba(255,251,242,0.04), rgba(255,251,242,0.01))",
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="font-[family-name:var(--font-display)] text-[64px] leading-none text-sand/[0.06]">
                  {step.num}
                </span>
                <h3 className="mt-2 text-[20px] font-semibold text-sand">
                  {step.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-sand/55">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative overflow-hidden bg-[#fffbf2] py-20 sm:py-[120px]">
        <div className="relative mx-auto max-w-[720px] px-5 text-center sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Divider />
            <p className="mb-4 mt-5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#B8922A]">
              Next Step
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4.5vw,52px)] leading-[1.1] text-dark-green">
              Reserve your masjid&apos;s spot.
            </h2>
            <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-[1.7] text-dark-green/55">
              A 20-minute walkthrough in your time zone. We answer every question. You leave with a clear picture of what your masjid&apos;s app would look like, what onboarding involves, and what it costs.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/waitlist"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-dark-green px-8 py-4 text-[14px] font-semibold text-sand transition-all duration-300 hover:shadow-lg hover:shadow-dark-green/20"
              >
                <span className="relative z-10">Reserve your masjid&apos;s spot</span>
                <ArrowRight size={16} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#1a6b42]/30 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-dark-green/15 px-6 py-4 text-[14px] font-semibold text-dark-green transition-all duration-300 hover:bg-dark-green/[0.04]"
              >
                See pricing
              </Link>
            </div>

            <p className="mt-6 text-[13px] text-dark-green/35">
              No commitment. No deck. Just a conversation.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
