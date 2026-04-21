"use client";

import { motion } from "framer-motion";
import { Smartphone, Palette, Zap, BarChart3, Shield, Globe } from "lucide-react";

const features = [
  {
    Icon: Smartphone,
    title: "No-Code App Builder",
    description: "Drag and drop to build your community's app. No developers, no coding, no hassle.",
    accent: "#1a6b42",
  },
  {
    Icon: Palette,
    title: "Custom Branding",
    description: "Your logo, your colors, your identity. Every app feels uniquely yours.",
    accent: "#9a7b2e",
  },
  {
    Icon: Zap,
    title: "Launch in Minutes",
    description: "Go from zero to a live app on the App Store and Google Play — fast.",
    accent: "#4a8c65",
  },
  {
    Icon: BarChart3,
    title: "Admin Dashboard",
    description: "Track engagement, manage content, and monitor donations from one place.",
    accent: "#0a261e",
  },
  {
    Icon: Shield,
    title: "Secure & Private",
    description: "Enterprise-grade security. Member data stays protected, always.",
    accent: "#1a6b42",
  },
  {
    Icon: Globe,
    title: "Multi-Language",
    description: "Arabic, English, and more. Reach every member of your community.",
    accent: "#B8922A",
  },
];

export default function Features() {
  return (
    <section id="how-it-works" className="relative z-10 overflow-hidden bg-[#fffbf2] py-32">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%230A261E' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative element */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, transparent, #B8922A60)" }} />
            <div className="h-1.5 w-1.5 rotate-45 bg-tan-gold/40" />
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, #B8922A60, transparent)" }} />
          </div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-tan-gold/60">Platform</p>
          <h2 className="mb-5 font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.5rem)] text-dark-green">
            Everything You Need
          </h2>
          <p className="mx-auto max-w-lg text-[15px] leading-relaxed text-dark-green/35">
            Sahla gives community centers the tools to build, launch, and grow their own mobile app — without writing a line of code.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-dark-green/[0.04] bg-white p-9 transition-all duration-500 hover:border-dark-green/[0.08] hover:shadow-xl hover:shadow-dark-green/[0.04]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Hover gradient accent at top */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, transparent, ${f.accent}40, transparent)` }}
              />

              {/* Icon container */}
              <div
                className="mb-6 flex h-13 w-13 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-105"
                style={{ backgroundColor: `${f.accent}08` }}
              >
                <f.Icon
                  size={22}
                  strokeWidth={1.8}
                  style={{ color: f.accent }}
                  className="transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <h3 className="mb-3 text-[17px] font-semibold text-dark-green">{f.title}</h3>
              <p className="text-[14px] leading-[1.7] text-dark-green/35">{f.description}</p>

              {/* Subtle corner decoration on hover */}
              <div
                className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, ${f.accent}08, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
