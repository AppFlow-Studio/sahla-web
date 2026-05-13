"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Globe, Translate, Clock, UsersThree } from "@phosphor-icons/react";

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
    icon: Translate,
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
    desc: "New York company with global reach. Enterprise-grade infrastructure trusted by masjids worldwide.",
    accent: "#9a7b2e",
  },
  {
    icon: UsersThree,
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
              className="font-[family-name:var(--font-hero)] text-[clamp(32px,4vw,48px)] leading-[1.1] text-dark-green"
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
              Built in NYC, serving mosques worldwide. From New York to Dubai, London to Tokyo &mdash; we power communities across every continent.
            </motion.p>

            {/* Stats strip */}
            <div className="mx-auto mt-12 grid max-w-[540px] grid-cols-4 gap-6 lg:mx-0">
              {cards.map((card, i) => (
                <motion.div
                  key={card.title}
                  className="text-center lg:text-left"
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <div className="mx-auto mb-3 flex h-[48px] w-[48px] items-center justify-center rounded-xl border border-dark-green/10 bg-dark-green/[0.04] lg:mx-0">
                    <card.icon size={22} weight="light" className="text-dark-green/60" />
                  </div>
                  <span className="block whitespace-nowrap text-[20px] font-bold tracking-tight text-dark-green">
                    {card.stat}
                  </span>
                  <p className="mt-1 text-[12px] leading-snug text-dark-green/50">
                    {card.title}
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
