"use client";

import { motion } from "framer-motion";
import { Heart, Eye, Users } from "lucide-react";

const values = [
  {
    Icon: Heart,
    title: "Built from lived experience",
    description: "Every product decision is made by people who attend mosques. We don't consult about Muslim communities — we're part of them.",
    accent: "#1a6b42",
  },
  {
    Icon: Eye,
    title: "Radical transparency",
    description: "No hidden fees, no surprise charges, no platform lock-in. You own your app, your data, and your relationships. We're a vendor, not an owner.",
    accent: "#d4af37",
  },
  {
    Icon: Users,
    title: "Community-first design",
    description: "We build around the rhythms of Islamic worship — five daily prayers, Jummah, Ramadan, Eid — not around generic event platforms.",
    accent: "#4a8c65",
  },
];

export default function AboutContent() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark-green pt-36 pb-20">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <motion.p
            className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            About Sahla
          </motion.p>
          <motion.h1
            className="mb-6 font-[family-name:var(--font-display)] text-[clamp(40px,5vw,64px)] leading-[1.06] text-sand"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            We built Sahla because we needed it.
          </motion.h1>
          <motion.p
            className="mx-auto max-w-[580px] text-[16px] leading-[1.7] text-sand/50"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Sahla started with a simple frustration: not knowing what&apos;s happening at our own mosque. Prayer times buried in group chats. Events announced the day before. Donation drives we didn&apos;t hear about until they were over. We knew there had to be a better way.
          </motion.p>
        </div>
      </section>

      {/* Founder story */}
      <section className="bg-[#fffbf2] py-[80px]">
        <div className="mx-auto max-w-[720px] px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,42px)] text-dark-green">
              The founder&apos;s story.
            </h2>
            <div className="space-y-5 text-[16px] leading-[1.8] text-dark-green/60">
              <p>
                I grew up going to the masjid. It was the center of my community — the place where I learned to pray, where I celebrated Eid, where I found belonging. But as I grew older, I watched that connection fray.
              </p>
              <p>
                The mosque was doing incredible work, but nobody knew about it. Prayer times changed and I&apos;d show up to an empty hall. Programs launched with no announcement. Youth drifted away because the mosque felt disconnected from their digital lives.
              </p>
              <p>
                I looked for a solution. Everything I found was either a generic event platform dressed up for mosques, or a custom app that cost more than most masjids raise in a year. Nothing was built <em>for</em> mosques, from the ground up, by people who actually attend them.
              </p>
              <p>
                That&apos;s why I built Sahla. Not as a tech startup chasing a market — as a Muslim who was frustrated that his own community didn&apos;t have a proper app.
              </p>
              <p className="font-semibold text-dark-green">— Temur, Founder & CEO</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-dark-green py-[80px]">
        <div className="mx-auto max-w-[1200px] px-8">
          <motion.h2
            className="mb-12 text-center font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,42px)] text-sand"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What we believe.
          </motion.h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                className="rounded-[20px] border border-sand/[0.06] p-8"
                style={{ background: "linear-gradient(180deg, rgba(255,251,242,0.025), rgba(255,251,242,0.01))" }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="mb-5 flex h-[50px] w-[50px] items-center justify-center rounded-xl" style={{ backgroundColor: `${v.accent}1A` }}>
                  <v.Icon size={24} strokeWidth={1.7} style={{ color: v.accent }} />
                </div>
                <h3 className="mb-3 text-[18px] font-semibold text-sand">{v.title}</h3>
                <p className="text-[14px] leading-[1.7] text-sand/45">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
