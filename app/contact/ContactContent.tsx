"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail, Phone, Clock,
  Users, Bell, Heart, Megaphone, TrendingUp,
  MessageCircle, Building, HelpCircle,
} from "lucide-react";

const contactInfo = [
  { Icon: Mail, label: "Email", value: "hello@sahla.app", href: "mailto:hello@sahla.app" },
  { Icon: Phone, label: "Phone", value: "(929) 555-0123", href: "tel:+19295550123" },
  { Icon: Clock, label: "Support Hours", value: "Mon–Fri, 9am–6pm ET", href: null },
];

const stats = [
  { Icon: Users, value: "3,500+", label: "Active app users" },
  { Icon: Bell, value: "95%", label: "Push notification reach" },
  { Icon: Heart, value: "$12K+", label: "Donations processed" },
  { Icon: Megaphone, value: "$13K+", label: "Business ad revenue" },
  { Icon: TrendingUp, value: "50+", label: "Programs managed" },
];

const reasons = [
  {
    Icon: Building,
    title: "You're an admin or board member exploring options",
    body: "Tell us about your community and what you've tried. We'll show you what your app could look like — no pitch, no pressure.",
    accent: "#1a6b42",
  },
  {
    Icon: MessageCircle,
    title: "You're an imam with a question",
    body: "Iqamah rules, Ramadan scheduling, prayer-time calculation methods — the answer matters. Send us the question and we'll answer in plain language.",
    accent: "#d4af37",
  },
  {
    Icon: HelpCircle,
    title: "You want to know if Sahla fits your mosque",
    body: "Every congregation is different. Tell us about yours and we'll be straight about whether we're the right tool — and what it would cost you.",
    accent: "#4a8c65",
  },
];

export default function ContactContent() {
  return (
    <>
      <section className="bg-dark-green pt-36 pb-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">Contact</p>
              <h1 className="mb-6 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-sand">
                Let&apos;s talk.
              </h1>
              <p className="mb-10 max-w-[480px] text-[16px] leading-[1.7] text-sand/50">
                Whether you&apos;re a mosque admin exploring options, a board member with questions, or an imam curious about Sahla — we&apos;d love to hear from you.
              </p>

              <div className="space-y-5">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#1a6b42]/20">
                      <item.Icon size={18} strokeWidth={1.7} className="text-[#4a8c65]" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-sand/40">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-[15px] text-sand/75 transition-colors hover:text-sand">{item.value}</a>
                      ) : (
                        <p className="text-[15px] text-sand/75">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — form */}
            <motion.div
              className="overflow-hidden rounded-[24px] border border-sand/[0.08] p-8"
              style={{ background: "linear-gradient(180deg, rgba(255,251,242,0.03), rgba(255,251,242,0.01))" }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Name</label>
                  <input type="text" required className="w-full rounded-xl border border-sand/10 bg-sand/[0.04] px-4 py-3 text-[14px] text-sand placeholder:text-sand/25 focus:border-sand/20 focus:outline-none" placeholder="Your name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Email</label>
                  <input type="email" required className="w-full rounded-xl border border-sand/10 bg-sand/[0.04] px-4 py-3 text-[14px] text-sand placeholder:text-sand/25 focus:border-sand/20 focus:outline-none" placeholder="you@email.com" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Message</label>
                  <textarea rows={5} required className="w-full resize-none rounded-xl border border-sand/10 bg-sand/[0.04] px-4 py-3 text-[14px] text-sand placeholder:text-sand/25 focus:border-sand/20 focus:outline-none" placeholder="Tell us about your mosque and how we can help..." />
                </div>
                <button type="submit" className="w-full rounded-full bg-sand py-3.5 text-[13px] font-semibold text-dark-green transition-all duration-300 hover:bg-sand/90">
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats — proof of what one mosque has done with Sahla */}
      <section className="border-t border-b border-[#d9c4a0]/12 bg-dark-green">
        <div className="mx-auto max-w-[1100px] px-8 py-10">
          <p className="mb-6 text-center text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]/70">
            One mosque, one year on Sahla
          </p>
          <div className="grid grid-cols-2 gap-y-6 lg:grid-cols-5">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <stat.Icon size={20} className="mb-2 text-[#d9c4a0]/60" />
                <span className="font-[family-name:var(--font-display)] text-[32px] leading-none text-[#d9c4a0]">
                  {stat.value}
                </span>
                <p className="mt-2 max-w-[140px] text-[11px] font-medium uppercase tracking-[0.2em] text-sand/40">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-[#fffbf2] py-[80px]">
        <div className="mx-auto max-w-[820px] px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[24px] border border-dark-green/[0.06] bg-white p-10 text-center shadow-[0_30px_80px_-50px_rgba(13,38,30,0.25)]"
          >
            <div className="mb-5 flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-4 w-4 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="font-[family-name:var(--font-display)] text-[clamp(20px,2.4vw,26px)] leading-[1.45] text-dark-green">
              &ldquo;Sahla gave our mosque its own identity in the App Store. Our community finally has one place for prayer times, events, and donations. It&apos;s changed how we connect with our families.&rdquo;
            </blockquote>
            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.18em] text-dark-green/55">
              MAS Staten Island Administration
            </p>
            <Link
              href="/customers/mas-si"
              className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-dark-green transition-colors hover:text-[#1a6b42]"
            >
              Read the full case study
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why people reach out */}
      <section className="bg-dark-green py-[80px]">
        <div className="mx-auto max-w-[1200px] px-8">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">
              What people write us about
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,42px)] text-sand">
              You don&apos;t need to have it figured out.
            </h2>
            <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.7] text-sand/50">
              Most of the messages we get don&apos;t start with &ldquo;we want to buy.&rdquo; They start with a question. That&apos;s a good place to start.
            </p>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-3">
            {reasons.map((r, i) => (
              <motion.div
                key={r.title}
                className="rounded-[20px] border border-sand/[0.06] p-8"
                style={{ background: "linear-gradient(180deg, rgba(255,251,242,0.025), rgba(255,251,242,0.01))" }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className="mb-5 flex h-[44px] w-[44px] items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${r.accent}1A` }}
                >
                  <r.Icon size={20} strokeWidth={1.7} style={{ color: r.accent }} />
                </div>
                <h3 className="mb-3 text-[16px] font-semibold leading-[1.35] text-sand">
                  {r.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-sand/50">{r.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
