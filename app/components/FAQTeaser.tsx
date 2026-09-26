"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { faqs } from "./faqTeaserData";

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
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#9a7b2e]">Common Questions</p>
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
                      "flex shrink-0 items-center justify-center transition-colors duration-300",
                      isOpen ? "text-dark-green" : "text-dark-green/40"
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
