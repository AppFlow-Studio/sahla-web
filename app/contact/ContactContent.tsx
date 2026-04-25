"use client";

import { motion } from "framer-motion";
import { Mail, Phone, Clock } from "lucide-react";

const contactInfo = [
  { Icon: Mail, label: "Email", value: "hello@sahla.app", href: "mailto:hello@sahla.app" },
  { Icon: Phone, label: "Phone", value: "(929) 555-0123", href: "tel:+19295550123" },
  { Icon: Clock, label: "Support Hours", value: "Mon–Fri, 9am–6pm ET", href: null },
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
    </>
  );
}
