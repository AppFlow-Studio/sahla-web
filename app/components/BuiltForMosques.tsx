"use client";

import { motion } from "framer-motion";
import { Heart, Shield, Moon } from "@phosphor-icons/react";

const pillars = [
  {
    Icon: Heart,
    title: "By Muslims, for masjids.",
    description:
      "Every product decision is made by people who attend mosques, not consultants who don't. We understand the rhythms of your community because we live them.",
    accent: "#1a6b42",
  },
  {
    Icon: Shield,
    title: "Sharia-aware donations.",
    description:
      "Stripe Connect with the masjid owning the account. Zakat, Sadaqah, and project-specific giving handled correctly — because the distinction matters.",
    accent: "#d4af37",
  },
  {
    Icon: Moon,
    title: "Built around Islamic worship.",
    description:
      "Five daily prayers. Jummah. Ramadan. Eid. Taraweeh. Your app follows the rhythm of your ibadah — not bolted onto a generic event platform.",
    accent: "#4a8c65",
  },
];

export default function BuiltForMosques() {
  const hero = pillars[0];
  const HeroIcon = hero.Icon;

  return (
    <section className="relative overflow-hidden bg-[#fffbf2] py-16 sm:py-[100px]">

      <motion.div
        className="relative mx-auto max-w-[1200px] px-5 sm:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-16 text-center">
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-dark-green/40">Our DNA</p>
          <h2 className="mt-4 font-[family-name:var(--font-hero)] text-[clamp(32px,4vw,52px)] text-dark-green">
            An app made by the people who pray beside you.
          </h2>
        </div>

        {/* Bento grid: 1 large left + 2 stacked right */}
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          {/* Hero card */}
          <div
            className="group relative flex flex-col justify-end overflow-hidden rounded-[24px] border border-sand/[0.06] p-6 sm:p-10"
            style={{
              background: `linear-gradient(160deg, ${hero.accent}1A 0%, rgba(255,251,242,0.02) 60%)`,
              minHeight: "260px",
            }}
          >
            <div className="pointer-events-none absolute top-8 right-8 opacity-[0.06]">
              <HeroIcon size={140} weight="duotone" className="text-sand" />
            </div>
            <div
              className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-sand/10 bg-sand/[0.06] transition-transform duration-500 group-hover:scale-110"
            >
              <HeroIcon size={22} weight="light" className="text-sand/70" />
            </div>
            <h3 className="mb-3 text-[22px] font-semibold text-sand">{hero.title}</h3>
            <p className="max-w-[420px] text-[15px] leading-[1.7] text-sand/70">{hero.description}</p>
            <div
              className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
              style={{ background: `linear-gradient(90deg, ${hero.accent}, transparent)` }}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {pillars.slice(1).map((p) => (
              <div
                key={p.title}
                className="group relative flex-1 overflow-hidden rounded-[24px] border border-sand/[0.06] p-5 sm:p-8"
                style={{
                  background: `linear-gradient(160deg, ${p.accent}12 0%, rgba(255,251,242,0.02) 60%)`,
                }}
              >
                <div className="flex items-start gap-5">
                  <div
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-sand/10 bg-sand/[0.06] transition-transform duration-500 group-hover:scale-110"
                  >
                    <p.Icon size={20} weight="light" className="text-sand/70" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-[17px] font-semibold text-sand">{p.title}</h3>
                    <p className="text-[14px] leading-[1.7] text-sand/70">{p.description}</p>
                  </div>
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: `linear-gradient(90deg, ${p.accent}, transparent)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
