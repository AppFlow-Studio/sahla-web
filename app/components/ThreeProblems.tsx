"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Globe, Languages, Clock, Users } from "lucide-react";

const VisibilityGlobe = dynamic(() => import("./VisibilityGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-green/10 border-t-dark-green/40" />
    </div>
  ),
});

const cards = [
  {
    icon: Languages,
    stat: "30+",
    title: "Languages supported",
    desc: "Arabic, Urdu, Turkish, Malay, French, Somali \u2014 your app speaks your community\u2019s language.",
    accent: "#9a7b2e",
  },
  {
    icon: Clock,
    stat: "24/7",
    title: "Every timezone covered",
    desc: "Automatic prayer calculations for any location on earth. Your community always knows when to pray.",
    accent: "#1a6b42",
  },
  {
    icon: Globe,
    stat: "USA-based",
    title: "International clients",
    desc: "American company with global reach. Enterprise-grade infrastructure trusted by masjids worldwide.",
    accent: "#9a7b2e",
  },
  {
    icon: Users,
    stat: "One ummah",
    title: "Connected worldwide",
    desc: "Every masjid that joins strengthens the network. Be part of something bigger than your neighborhood.",
    accent: "#1a6b42",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.15 + i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function ThreeProblems() {
  return (
    <section className="relative overflow-hidden bg-[#fffbf2] py-16 sm:py-[100px]">
      <motion.div
        className="relative mx-auto max-w-[1200px] px-5 sm:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Globe */}
          <div className="relative">
            {/* Glow behind globe */}
            <div className="pointer-events-none absolute inset-0 -m-8 rounded-full bg-[radial-gradient(circle,rgba(26,107,66,0.08)_0%,transparent_70%)]" />
            <Suspense>
              <VisibilityGlobe />
            </Suspense>
          </div>

          {/* Content */}
          <div className="text-center lg:text-left">
            <motion.p
              className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#9a7b2e]"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Global Reach
            </motion.p>

            <motion.h2
              className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] leading-[1.1] text-dark-green"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              Join our global community of masjids
            </motion.h2>

            <motion.p
              className="mx-auto mt-5 max-w-[480px] text-[15px] leading-[1.75] text-dark-green/50 lg:mx-0"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Built in America, serving mosques worldwide. From New York to Dubai, London to Tokyo &mdash; we power communities across every continent.
            </motion.p>

            {/* Cards */}
            <div className="mx-auto mt-10 grid max-w-[500px] gap-4 sm:grid-cols-2 lg:mx-0">
              {cards.map((card, i) => (
                <motion.div
                  key={card.title}
                  className="group relative overflow-hidden rounded-2xl border border-dark-green/[0.06] bg-white/70 px-5 py-5 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(10,38,30,0.06)]"
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* Subtle accent bar */}
                  <div
                    className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl opacity-60"
                    style={{ background: card.accent }}
                  />

                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: `${card.accent}12` }}
                    >
                      <card.icon
                        size={18}
                        strokeWidth={1.8}
                        style={{ color: card.accent }}
                      />
                    </div>
                    <span className="text-[20px] font-bold tracking-tight text-dark-green">
                      {card.stat}
                    </span>
                  </div>

                  <div className="text-[13px] font-semibold text-dark-green/75">
                    {card.title}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-[1.55] text-dark-green/40">
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
