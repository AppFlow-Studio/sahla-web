"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CalendarDots, DeviceMobile, Buildings, CurrencyDollar, Heart,
} from "@phosphor-icons/react";
import { AnimatedList } from "@/components/ui/animated-list";

/* ── Free-floating animated previews ── */

function NotificationsPreview() {
  const notifs = [
    { msg: "Maghrib in 15 minutes", time: "Just now" },
    { msg: "New event: Friday Halaqa", time: "2m ago" },
    { msg: "Donation goal reached!", time: "1h ago" },
    { msg: "Isha prayer time updated", time: "3h ago" },
    { msg: "New member joined", time: "5h ago" },
    { msg: "Jummah reminder", time: "6h ago" },
    { msg: "Taraweeh tonight at 9 PM", time: "7h ago" },
  ];
  return (
    <div className="w-full max-w-[360px] [mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)]">
      <AnimatedList delay={1400} className="gap-2.5">
        {notifs.map((n) => (
          <div key={n.msg} className="flex w-full items-center gap-3 rounded-xl border border-dark-green/[0.06] bg-white px-4 py-3 shadow-[0_1px_8px_-2px_rgba(10,38,30,0.06)]">
            <div className="h-2 w-2 shrink-0 rounded-full bg-[#1a6b42]" />
            <span className="flex-1 text-[13px] font-medium text-dark-green/70">{n.msg}</span>
            <span className="shrink-0 text-[11px] text-dark-green/25">{n.time}</span>
          </div>
        ))}
      </AnimatedList>
    </div>
  );
}

function CalendarPreview() {
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const events = [2, 6, 9, 14, 17, 21, 24, 27];
  const [selected, setSelected] = useState(14);

  useEffect(() => {
    let i = events.indexOf(selected);
    const interval = setInterval(() => {
      i = (i + 1) % events.length;
      setSelected(events[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-[300px]">
      <div className="mb-4 text-[15px] font-medium text-dark-green/40">May 2026</div>
      <div className="mb-2 grid grid-cols-7 gap-2">
        {dayLabels.map((d, i) => (
          <span key={i} className="text-center text-[11px] font-medium text-dark-green/25">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }, (_, i) => (
          <div
            key={i}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-[13px] transition-all duration-500 ${
              events.includes(i) ? "bg-[#1a6b42]/10 font-medium text-dark-green" : "text-dark-green/20"
            } ${i === selected ? "ring-2 ring-[#1a6b42]/40 scale-110 bg-[#1a6b42]/15" : ""}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

function WhiteLabelPreview() {
  const [activeApp, setActiveApp] = useState(0);
  const apps = [
    { icon: "https://sahla.b-cdn.net/massicliquidglassicon%20copy%202.png", name: "MAS SI", subtitle: "Muslim American Society", rating: "5.0", color: "" },
    { icon: "", name: "Al-Noor Masjid", subtitle: "Community App", rating: "4.9", color: "#2563eb" },
    { icon: "", name: "ICB App", subtitle: "Islamic Center", rating: "4.8", color: "#7c3aed" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveApp((prev) => (prev + 1) % apps.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [apps.length]);

  return (
    <div className="flex gap-5">
      {apps.map((a, i) => (
        <div
          key={a.name}
          className={`flex w-[130px] flex-col items-center gap-2.5 rounded-2xl p-4 transition-all duration-500 ${
            i === activeApp ? "scale-105 bg-dark-green/[0.03]" : "scale-100"
          }`}
        >
          {a.icon ? (
            <img src={a.icon} alt={a.name} className="h-14 w-14 rounded-[16px] shadow-md" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] shadow-md" style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}cc)` }}>
              <Buildings size={24} weight="fill" className="text-white/90" />
            </div>
          )}
          <div className="text-center">
            <div className={`text-[12px] font-semibold transition-colors duration-500 ${i === activeApp ? "text-dark-green" : "text-dark-green/40"}`}>{a.name}</div>
            <div className="mt-0.5 text-[9px] text-dark-green/25">{a.subtitle}</div>
          </div>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, j) => (
              <svg key={j} className="h-2.5 w-2.5 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <div className={`rounded-full px-3.5 py-1 text-[10px] font-semibold transition-all duration-500 ${i === activeApp ? "bg-[#007AFF] text-white" : "bg-dark-green/[0.05] text-dark-green/30"}`}>
            GET
          </div>
        </div>
      ))}
    </div>
  );
}

function SponsorsPreview() {
  const [active, setActive] = useState(0);
  const sponsors = ["Local Bakery", "Auto Shop", "Bookstore", "Pharmacy", "Grocery", "Clinic"];

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % sponsors.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [sponsors.length]);

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {sponsors.map((b, i) => (
        <div
          key={b}
          className={`flex h-16 w-24 items-center justify-center rounded-xl transition-all duration-500 ${
            i === active ? "bg-dark-green/[0.06] scale-105" : "bg-dark-green/[0.02] scale-100"
          }`}
        >
          <span className={`text-[12px] font-medium transition-colors duration-500 ${i === active ? "text-dark-green/60" : "text-dark-green/25"}`}>{b}</span>
        </div>
      ))}
    </div>
  );
}

function CRMPreview() {
  const barSets = [
    [40, 65, 45, 80, 60, 90, 70, 55, 75, 50, 85, 60],
    [55, 45, 70, 60, 85, 50, 80, 65, 45, 75, 55, 90],
    [70, 80, 55, 45, 65, 75, 50, 90, 60, 85, 40, 70],
  ];
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const [barIdx, setBarIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBarIdx((prev) => (prev + 1) % barSets.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [barSets.length]);

  const bars = barSets[barIdx];

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-5 flex justify-between">
        {[
          { label: "Users", val: "3,247", change: "+12%" },
          { label: "Opens", val: "18.4k", change: "+8%" },
          { label: "Revenue", val: "$4.1k", change: "+23%" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[22px] font-bold text-dark-green/50">{s.val}</span>
              <span className="text-[10px] font-medium text-[#1a6b42]">{s.change}</span>
            </div>
            <span className="text-[10px] text-dark-green/25">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between gap-1">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-5 rounded-t bg-[#1a6b42]/15 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ height: `${h * 1.2}px` }}
            />
            <span className="text-[8px] text-dark-green/15">{months[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonationsPreview() {
  const goals = [
    { amount: "$12,450", pct: 72, goal: "$17,000" },
    { amount: "$8,200", pct: 41, goal: "$20,000" },
    { amount: "$5,800", pct: 93, goal: "$6,250" },
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % goals.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [goals.length]);

  const g = goals[idx];
  return (
    <div className="w-full max-w-[280px] space-y-4">
      <motion.div
        key={g.amount}
        className="text-center text-[36px] font-bold text-dark-green/50"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {g.amount}
      </motion.div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-dark-green/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#d4af37]/60 to-[#d4af37]/30"
          animate={{ width: `${g.pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="text-center text-[12px] text-dark-green/30">
        {g.pct}% of {g.goal} goal
      </div>
      <div className="flex justify-center gap-2">
        {["$10", "$25", "$50", "$100"].map((a) => (
          <div key={a} className="rounded-lg bg-dark-green/[0.04] px-3.5 py-1.5 text-[11px] font-medium text-dark-green/40">{a}</div>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    Icon: Bell,
    name: "Push Notifications",
    description: "Per-prayer, per-program alerts that reach your entire community instantly. Configurable per-user so nobody gets spammed.",
    preview: <NotificationsPreview />,
  },
  {
    Icon: CalendarDots,
    name: "Programs & Events",
    description: "Halaqas, classes, Ramadan schedules — your community's full calendar in one place with RSVP tracking.",
    preview: <CalendarPreview />,
  },
  {
    Icon: DeviceMobile,
    name: "White-Label App",
    description: "Your name, your logo, your colors — a standalone app in the App Store. Not a page inside someone else's platform.",
    preview: <WhiteLabelPreview />,
  },
  {
    Icon: Buildings,
    name: "Business Sponsors",
    description: "Local businesses sponsor ad space in your app. Your mosque keeps 100% of that recurring revenue — Sahla takes nothing.",
    preview: <SponsorsPreview />,
  },
  {
    Icon: CurrencyDollar,
    name: "Admin CRM",
    description: "Track engagement, manage content, monitor donations, and see real-time analytics — all from one dashboard.",
    preview: <CRMPreview />,
  },
  {
    Icon: Heart,
    name: "Donations",
    description: "Zakat, Sadaqah, and project-specific giving — directly to your Stripe account. Every dollar goes straight to your mosque.",
    preview: <DonationsPreview />,
  },
];

export default function Features() {
  return (
    <section className="relative bg-[#fffbf2] py-16 sm:py-[100px]">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <motion.div
          className="mb-20 text-center sm:mb-28"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-dark-green/40">What&apos;s In The App</p>
          <h2 className="mt-4 font-[family-name:var(--font-hero)] text-[clamp(36px,4.5vw,60px)] text-dark-green">
            Everything your mosque needs.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-x-16 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <motion.div
              key={f.name}
              className="flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Animation */}
              <div className="mb-5 flex h-[180px] items-center justify-center overflow-hidden">
                <div className="scale-[0.65] transform">{f.preview}</div>
              </div>

              {/* Text */}
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-green/10 bg-dark-green/[0.03]">
                  <f.Icon size={14} weight="light" className="text-dark-green/50" />
                </div>
                <h3 className="text-[16px] font-semibold text-dark-green">{f.name}</h3>
              </div>
              <p className="text-[13px] leading-[1.65] text-dark-green/45">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
