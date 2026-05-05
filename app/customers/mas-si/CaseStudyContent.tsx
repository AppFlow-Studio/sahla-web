"use client";

import { motion } from "framer-motion";

import { Users, Bell, Heart, TrendingUp, Megaphone } from "lucide-react";

const stats = [
  { Icon: Users, value: "3,000+", label: "Active app users" },
  { Icon: Bell, value: "95%", label: "Push notification reach" },
  { Icon: Heart, value: "$12K+", label: "Donations processed" },
  { Icon: Megaphone, value: "$13K+", label: "Business ad revenue" },
  { Icon: TrendingUp, value: "50+", label: "Programs managed" },
];

export default function CaseStudyContent() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark-green pt-36 pb-20">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <motion.p
            className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Case Study
          </motion.p>
          <motion.h1
            className="mb-6 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-sand"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            MAS Staten Island
          </motion.h1>
          <motion.p
            className="mx-auto max-w-[540px] text-[16px] leading-[1.7] text-sand/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            How one of New York&apos;s most active mosques launched their own branded app — and connected with 3,000+ community members.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-b border-[#d9c4a0]/12 bg-dark-green">
        <div className="mx-auto grid max-w-[1000px] grid-cols-2 px-8 py-10 lg:grid-cols-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center py-3 text-center"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <stat.Icon size={20} className="mb-2 text-[#d9c4a0]/60" />
              <span className="font-[family-name:var(--font-display)] text-[32px] leading-none text-[#d9c4a0]">{stat.value}</span>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-sand/40">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-[#fffbf2] py-[80px]">
        <div className="mx-auto max-w-[720px] px-8">
          <motion.div
            className="space-y-10"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-[28px] text-dark-green">The Problem</h2>
              <p className="text-[16px] leading-[1.8] text-dark-green/60">
                MAS Staten Island is one of the most active mosques in New York City, with hundreds of families attending weekly. But like many mosques, they relied on WhatsApp groups, Facebook posts, and word of mouth to communicate with their community. Important announcements got buried. New families couldn&apos;t find prayer times. Donation drives reached only a fraction of the congregation.
              </p>
            </div>

            <div>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-[28px] text-dark-green">The Solution</h2>
              <p className="text-[16px] leading-[1.8] text-dark-green/60">
                MAS Staten Island partnered with Sahla to build their own branded app — listed in the App Store under their mosque&apos;s name, with their colors and identity. The onboarding took 30 minutes. Within two weeks, their community had a dedicated app with prayer times, push notifications, donation campaigns, and a full program calendar.
              </p>
            </div>

            <div>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-[28px] text-dark-green">The Results</h2>
              <p className="text-[16px] leading-[1.8] text-dark-green/60">
                Within months, over 3,000 community members downloaded and actively use the app. Push notifications reach 95% of the congregation. Donation campaigns are more visible and accessible. Programs that used to struggle for attendance are now full. The mosque&apos;s board has complete visibility into engagement and can communicate with every family in seconds.
              </p>
            </div>

            {/* Pull quote */}
            <div className="rounded-[20px] border border-dark-green/[0.06] bg-white p-8">
              <blockquote className="text-[18px] leading-[1.7] italic text-dark-green/70">
                &ldquo;Sahla gave our mosque its own identity in the App Store. Our community finally has one place for prayer times, events, and donations. It&apos;s changed how we connect with our families.&rdquo;
              </blockquote>
              <p className="mt-4 text-[14px] font-semibold text-dark-green">— MAS Staten Island Administration</p>
            </div>
          </motion.div>
        </div>
      </section>

    </>
  );
}
