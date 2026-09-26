"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { categories } from "./faqData";

function AccordionItem({ faq, itemKey, openItems, toggle }: {
  faq: { q: string; a: string };
  itemKey: string;
  openItems: Record<string, boolean>;
  toggle: (key: string) => void;
}) {
  const isOpen = openItems[itemKey];

  return (
    <div>
      <button
        onClick={() => toggle(itemKey)}
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
    </div>
  );
}

export default function FAQContent() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <section className="bg-[#fffbf2] pt-36 pb-20">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <motion.p
            className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-dark-green/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            FAQ
          </motion.p>
          <motion.h1
            className="mb-6 font-[family-name:var(--font-hero)] text-[clamp(40px,5vw,64px)] leading-[1.06] text-dark-green"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Frequently asked questions.
          </motion.h1>
          <motion.p
            className="mx-auto max-w-[520px] text-[16px] leading-[1.7] text-dark-green/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            The questions mosque boards ask before saying yes. If yours isn&apos;t here, <Link href="/contact" className="underline underline-offset-4 text-dark-green/70 hover:text-dark-green transition-colors">reach out</Link>.
          </motion.p>
        </div>
      </section>

      <section className="bg-[#fffbf2] pb-[100px]">
        <div className="mx-auto max-w-[800px] px-8">
          {categories.map((cat, ci) => (
            <motion.div
              key={cat.title}
              className="mb-14 last:mb-0"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.08 }}
            >
              <h2 className="mb-2 font-[family-name:var(--font-hero)] text-[26px] text-dark-green">{cat.title}</h2>
              <div className="divide-y divide-dark-green/[0.06]">
                {cat.faqs.map((faq, fi) => {
                  const key = `${ci}-${fi}`;
                  return (
                    <AccordionItem
                      key={key}
                      faq={faq}
                      itemKey={key}
                      openItems={openItems}
                      toggle={toggle}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
