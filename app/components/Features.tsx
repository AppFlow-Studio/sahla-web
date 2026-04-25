"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Clock, Heart, Bell, BookOpen,
  Calendar, Smartphone, DollarSign, Building,
} from "lucide-react";

const features = [
  {
    Icon: Clock,
    title: "Prayer Times",
    description: "Accurate adhan and iqamah times with live countdown and push alerts.",
    href: "/product/prayer-times",
    accent: "#1a6b42",
  },
  {
    Icon: Bell,
    title: "Push Notifications",
    description: "Per-prayer, per-program alerts that reach your entire community instantly.",
    href: "/product/notifications",
    accent: "#4a8c65",
  },
  {
    Icon: Heart,
    title: "Donations",
    description: "Zakat, Sadaqah, and project-specific giving — directly to your Stripe account.",
    href: "/product/donations",
    accent: "#b8922a",
  },
  {
    Icon: Calendar,
    title: "Programs & Events",
    description: "Halaqas, classes, Ramadan schedules — your community's full calendar.",
    href: "/product/programs",
    accent: "#d9c4a0",
  },
  {
    Icon: BookOpen,
    title: "Quran & Lectures",
    description: "Full Quran reader, audio recitations, and your mosque's lecture library.",
    href: "#",
    accent: "#1a6b42",
  },
  {
    Icon: Smartphone,
    title: "White-Label App",
    description: "Your name, your logo, your colors — a standalone app in the App Store.",
    href: "/why-sahla",
    accent: "#4a8c65",
  },
  {
    Icon: Building,
    title: "Business Sponsors",
    description: "Local businesses sponsor your app. You keep 100% of recurring ad revenue.",
    href: "/business-ads",
    accent: "#d4af37",
  },
  {
    Icon: DollarSign,
    title: "Admin CRM",
    description: "Track engagement, manage content, and monitor everything from one dashboard.",
    href: "/product/admin-crm",
    accent: "#b8922a",
  },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden border-t border-b border-[#d9c4a0]/8 bg-[#081f18] py-16 sm:py-[120px]">
      {/* Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      <motion.div
        className="relative mx-auto max-w-[1200px] px-5 sm:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-10 text-center sm:mb-[72px]">
          <div className="mb-5 flex items-center justify-center gap-3.5">
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(217,196,160,0.5))" }} />
            <div className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, rgba(217,196,160,0.5), transparent)" }} />
          </div>
          <p className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">What&apos;s In The App</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,60px)] text-sand">
            Everything your mosque needs.
          </h2>
          <p className="mx-auto mt-[18px] max-w-[520px] text-[15px] leading-[1.65] text-sand/45">
            Eight core features, all wrapped in your masjid&rsquo;s brand.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link href={f.href} key={f.title}>
              <div
                className="group relative h-full overflow-hidden rounded-[20px] border border-sand/[0.06] p-5 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#d9c4a0]/25 sm:p-[30px_26px]"
                style={{
                  background: "linear-gradient(180deg, rgba(255,251,242,0.025), rgba(255,251,242,0.01))",
                }}
              >
                {/* Top accent line on hover */}
                <div
                  className="absolute inset-x-0 top-0 h-[1px] origin-center scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, transparent, ${f.accent}88, transparent)` }}
                />

                <div
                  className="mb-[18px] flex h-[42px] w-[42px] items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: `${f.accent}1A` }}
                >
                  <f.Icon size={20} strokeWidth={1.7} style={{ color: f.accent }} />
                </div>

                <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.005em] text-sand">{f.title}</h3>
                <p className="text-[13px] leading-[1.65] text-sand/42">{f.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
