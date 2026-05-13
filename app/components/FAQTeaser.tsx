"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    a: "Sahla costs $300/month. But local businesses can sponsor ad space in your app at $100/month each. At just 3 sponsors, the app pays for itself. Many mosques generate surplus revenue.",
  },
  {
    q: "Can we cancel anytime?",
    a: "Yes. No long-term contracts. Cancel anytime with 30 days notice. We provide a full data export, and your app remains yours.",
  },
  {
    q: "How long until our app is live?",
    a: "From onboarding to App Store submission takes about 2 weeks. Apple review adds another 7–14 days. Most mosques are live within a month.",
  },
  {
    q: "Who handles updates and maintenance?",
    a: "We do. Bug fixes, OS updates, new features — all handled by Sahla. Your team focuses on content and community, not code.",
  },
];

export default function FAQTeaser() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden bg-[#fffbf2] py-16 sm:py-[120px]">
      <div className="relative mx-auto max-w-[800px] px-5 sm:px-8">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-dark-green/40">Common Questions</p>
          <h2 className="font-[family-name:var(--font-hero)] text-[clamp(32px,4vw,48px)] text-dark-green">
            Questions mosque boards ask.
          </h2>
        </motion.div>

        <div className="divide-y divide-dark-green/[0.06]">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 py-6 text-left sm:py-7"
                >
                  <span className="text-[17px] font-medium text-dark-green sm:text-[19px]">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                      isOpen ? "bg-dark-green text-sand" : "bg-dark-green/[0.06] text-dark-green/40"
                    )}
                  >
                    <IconPlus size={16} stroke={2} />
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
                      <p className="pb-7 pr-12 text-[15px] leading-[1.8] text-dark-green/50">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-10 text-center"
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
