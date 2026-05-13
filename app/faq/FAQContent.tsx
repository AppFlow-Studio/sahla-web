"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "Ownership & Data",
    faqs: [
      {
        q: "Do we own our app and data?",
        a: "Yes. Your app is listed under your mosque's Apple Developer and Google Play accounts. Your congregant data belongs to you — we hold it on your behalf, and you can export it at any time. If you leave Sahla, your app and data go with you.",
      },
      {
        q: "Who can see our donor data?",
        a: "Only your authorized mosque admins. Sahla never sells, shares, or analyzes your donor data for any purpose. Donations go directly to your Stripe Connect account — we never touch the funds.",
      },
      {
        q: "What happens to our data if we cancel?",
        a: "Full data export within 30 days. Permanent deletion within 60 days unless you request retention. Your app remains listed under your developer accounts.",
      },
    ],
  },
  {
    title: "Pricing & Costs",
    faqs: [
      {
        q: "What does it cost out of pocket each month?",
        a: "Sahla costs $300/month (or $325/month with the CRM add-on). No setup fees, no per-notification charges, no platform cut on donations or ad revenue. Local sponsors at $100/month each can offset or exceed this cost.",
      },
      {
        q: "Do we need an Apple Developer account?",
        a: "Yes, but most US mosques are 501(c)(3) nonprofits — and Apple waives the $99/year Developer Program fee for nonprofits in 13 countries including the US, provided the app is free in the App Store (which yours will be). We help you through the waiver process. Most mosques pay $0/year.",
      },
      {
        q: "Can we cancel anytime?",
        a: "Yes. No long-term contracts. Cancel anytime with 30 days notice. We provide a full data export within 30 days of cancellation.",
      },
      {
        q: "How does the sponsor revenue model work?",
        a: "Local businesses (halal restaurants, Islamic bookstores, tutors, etc.) pay $100/month for ad placement in your mosque's app. Your mosque keeps 100% of that recurring revenue — Sahla takes $0. At just 3 sponsors, the app pays for itself.",
      },
    ],
  },
  {
    title: "What Happens If...",
    faqs: [
      {
        q: "What happens if Sahla shuts down?",
        a: "We provide a complete data export at any time. Your app source code is documented. Your Apple Developer and Google Play accounts are yours. You can transition to another vendor or take development in-house.",
      },
      {
        q: "What if Apple removes our app?",
        a: "We handle all App Review submissions and document your mosque's unique content to satisfy Apple's guidelines. We have not had a mosque app rejected. If something goes wrong, we resubmit at no cost and work with Apple until it's resolved.",
      },
      {
        q: "What if our imam or board disagrees with Sahla's leadership?",
        a: "Our service is operationally neutral. We do not censor content, push positions, or interfere with mosque governance. Sahla is a technology vendor — your mosque's leadership makes all content and community decisions.",
      },
      {
        q: "Are you GDPR / CCPA compliant?",
        a: "Yes. We take data privacy seriously. We comply with GDPR, CCPA, and other applicable privacy regulations. Your congregants' data is encrypted at rest and in transit, and we never share it with third parties.",
      },
    ],
  },
  {
    title: "Getting Started",
    faqs: [
      {
        q: "How long does it take to launch?",
        a: "Onboarding takes about 30 minutes. From there, we build and submit your app within days. Apple's review process typically takes 24-48 hours. Most mosques are live within one to two weeks.",
      },
      {
        q: "Do we need a technical person on staff?",
        a: "No. Sahla is designed for mosque admins, not developers. If you can send an email, you can manage your mosque's app. We handle all the technical work.",
      },
      {
        q: "Can we see the platform before committing?",
        a: "Yes. Join the waitlist and we'll reach out as your wave opens — we'll walk you through the platform on a 15-minute call, show you real mosque apps, and answer every question your board has.",
      },
    ],
  },
];

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
