"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    q: "Do we own our app and data?",
    a: "Yes. Your app is listed under your mosque's developer account. Your congregant data belongs to you — we hold it on your behalf, and you can export it anytime. If you leave Sahla, your app and data go with you.",
  },
  {
    q: "Do we need an Apple Developer account?",
    a: "Yes, but most US mosques are 501(c)(3) nonprofits — Apple waives the $99/year Developer Program fee for nonprofits. We help you through the waiver process. Most mosques pay $0/year.",
  },
  {
    q: "What does it cost out of pocket each month?",
    a: "Sahla costs $300/month. But local businesses can sponsor ad space in your app at $50/month each. At just 6 sponsors, the app pays for itself. Many mosques generate surplus revenue.",
  },
  {
    q: "Can we cancel anytime?",
    a: "Yes. No long-term contracts. Cancel anytime with 30 days notice. We provide a full data export, and your app remains yours.",
  },
];

export default function FAQTeaser() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden bg-[#fffbf2] py-16 sm:py-[100px]">
      <div className="relative mx-auto max-w-[720px] px-5 sm:px-8">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#9a7b2e]">Common Questions</p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,48px)] text-dark-green">
            Questions mosque boards ask.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                className="group rounded-[16px] border border-dark-green/[0.06] bg-white transition-shadow duration-300 hover:shadow-[0_4px_20px_-8px_rgba(10,38,30,0.08)]"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left transition-colors duration-200 hover:bg-dark-green/[0.015]"
                >
                  <span className="pr-4 text-[15px] font-semibold text-dark-green">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ChevronDown size={18} className="shrink-0 text-dark-green/30" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-[14px] leading-[1.7] text-dark-green/55">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/faq" className="text-[14px] font-medium text-[#1a6b42] underline underline-offset-4 transition-colors duration-200 hover:text-dark-green">
            View all frequently asked questions
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
