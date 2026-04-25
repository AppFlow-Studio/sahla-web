"use client";

import { motion } from "framer-motion";
import { Heart, Shield, Moon } from "lucide-react";

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
    <section className="relative overflow-hidden bg-dark-green py-16 sm:py-[100px]">
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
        <div className="mb-16 text-center">
          <div className="mb-5 flex items-center justify-center gap-3.5">
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(217,196,160,0.5))" }} />
            <div className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, rgba(217,196,160,0.5), transparent)" }} />
          </div>
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">Our DNA</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(32px,4vw,52px)] text-sand">
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
              <HeroIcon size={140} strokeWidth={0.7} className="text-sand" />
            </div>
            <div
              className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundColor: `${hero.accent}22` }}
            >
              <HeroIcon size={24} strokeWidth={1.7} style={{ color: hero.accent }} />
            </div>
            <h3 className="mb-3 text-[22px] font-semibold text-sand">{hero.title}</h3>
            <p className="max-w-[420px] text-[15px] leading-[1.7] text-sand/45">{hero.description}</p>
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
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundColor: `${p.accent}1A` }}
                  >
                    <p.Icon size={22} strokeWidth={1.7} style={{ color: p.accent }} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-[17px] font-semibold text-sand">{p.title}</h3>
                    <p className="text-[14px] leading-[1.7] text-sand/45">{p.description}</p>
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
