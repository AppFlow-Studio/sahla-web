"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Sahla Standard",
    price: 300,
    period: "/mo",
    description: "Everything your mosque needs to launch and run a branded mobile app.",
    features: [
      "Fully branded iOS + Android app",
      "Your mosque's name in the App Store",
      "Prayer times with iqamah sync",
      "Push notifications (unlimited)",
      "Donation campaigns via Stripe Connect",
      "Programs & events management",
      "Quran reader & lecture library",
      "Business sponsor ad placements",
      "Admin dashboard",
      "Onboarding support",
    ],
    cta: "Reserve Now",
    href: "/waitlist",
    highlight: true,
  },
  {
    name: "Sahla + CRM",
    price: 325,
    period: "/mo",
    description: "Everything in Standard, plus the admin CRM for deeper community management.",
    features: [
      "Everything in Standard",
      "Admin CRM dashboard",
      "Member engagement analytics",
      "Advanced reporting",
      "Priority support",
      "Custom integrations",
    ],
    cta: "Reserve Now",
    href: "/waitlist",
    highlight: false,
  },
];

const noCharge = [
  "No setup fee",
  "No transaction fees on donations (only Stripe's standard 2.2% + $0.30 nonprofit rate)",
  "No platform cut on recurring ad revenue",
  "No charge per push notification",
  "No long-term contract",
];

export default function PricingPage() {
  const [sponsors, setSponsors] = useState(6);
  const ratePerSponsor = 50;
  const subscription = 300;
  const revenue = sponsors * ratePerSponsor;
  const net = subscription - revenue;

  return (
    <div className="relative">
      <Navbar />

      <section className="bg-[#fffbf2] pt-36 pb-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-dark-green/40">Pricing</p>
            <h1 className="font-[family-name:var(--font-hero)] text-[clamp(40px,5vw,64px)] leading-[1.06] text-dark-green">
              Simple, transparent pricing.
            </h1>
            <p className="mx-auto mt-5 max-w-[540px] text-[16px] leading-[1.7] text-dark-green/50">
              One plan. No hidden fees. And a revenue model that can make your app pay for itself.
            </p>
          </motion.div>

          {/* Plans */}
          <div className="mx-auto grid max-w-[900px] gap-12 lg:grid-cols-2 lg:divide-x lg:divide-dark-green/[0.06] lg:gap-0">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative p-2 sm:p-4 ${i === 1 ? "lg:pl-12" : ""}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              >
                <p className="mb-2 text-[12px] font-semibold tracking-[0.2em] uppercase text-dark-green/40">{plan.name}</p>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-hero)] text-[56px] leading-none text-dark-green">${plan.price}</span>
                  <span className="text-[16px] text-dark-green/40">{plan.period}</span>
                </div>
                <p className="mb-8 text-[14px] leading-[1.6] text-dark-green/50">{plan.description}</p>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check size={16} className="mt-0.5 shrink-0 text-[#4a8c65]" />
                      <span className="text-[14px] text-dark-green/65">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className="block w-full rounded-full bg-dark-green py-3.5 text-center text-[13px] font-semibold text-sand transition-all duration-300 hover:bg-dark-green/90"
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What you DON'T pay */}
      <section className="bg-[#fffbf2] py-[80px]">
        <div className="mx-auto max-w-[720px] px-8">
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-[family-name:var(--font-hero)] text-[clamp(28px,3.5vw,42px)] text-dark-green">
              What you don&apos;t pay.
            </h2>
          </motion.div>
          <div className="space-y-4">
            {noCharge.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 py-4"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Check size={18} className="mt-0.5 shrink-0 text-[#1a6b42]" />
                <span className="text-[15px] text-dark-green/65">{item}</span>
              </motion.div>
            ))}
          </div>
          <motion.p
            className="mt-8 text-center text-[14px] text-dark-green/40"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Most mosque platforms charge $99&ndash;149/month with a fee on every donation. Sahla charges $300/month flat and takes nothing from your donations or recurring ad revenue.
          </motion.p>
        </div>
      </section>

      {/* Revenue calculator */}
      <section className="bg-[#fffbf2] py-[80px]">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-dark-green/40">The Revenue Flip</p>
              <h2 className="mb-5 font-[family-name:var(--font-hero)] text-[clamp(32px,4vw,52px)] leading-[1.08] text-dark-green">
                Your app pays for itself.
              </h2>
              <p className="mb-6 max-w-[480px] text-[16px] leading-[1.7] text-dark-green/50">
                Local businesses sponsor ad space in your mosque&apos;s app at ${ratePerSponsor}/month each. You keep 100% of recurring ad revenue — Sahla takes $0. At just {Math.ceil(subscription / ratePerSponsor)} sponsors, your app is free.
              </p>
              <p className="max-w-[480px] text-[14px] leading-[1.7] text-dark-green/35">
                Most mosque platforms charge $99&ndash;149/month with a fee on every donation. Sahla charges ${subscription}/month flat and takes nothing from your donations or recurring ad revenue.
              </p>
            </motion.div>

            {/* Right — calculator */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[14px] text-dark-green/60">Local sponsors</span>
                <span className="font-[family-name:var(--font-hero)] text-[28px] text-dark-green">{sponsors}</span>
              </div>
              <input
                type="range" min={0} max={15} value={sponsors}
                onChange={(e) => setSponsors(Number(e.target.value))}
                className="revenue-slider w-full"
                style={{ "--fill": `${(sponsors / 15) * 100}%` } as React.CSSProperties}
              />
              <div className="mt-1 flex justify-between text-[11px] text-dark-green/25">
                <span>0</span><span>15</span>
              </div>
            </div>
            <div className="space-y-4 border-t border-dark-green/[0.04] pt-6">
              <div className="flex justify-between">
                <span className="text-[14px] text-dark-green/60">Subscription</span>
                <span className="text-[16px] font-semibold text-dark-green">${subscription}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[14px] text-dark-green/60">Sponsor revenue ({sponsors} x ${ratePerSponsor})</span>
                <span className="text-[16px] font-semibold text-[#1a6b42]">-${revenue}/mo</span>
              </div>
              <div className="border-t border-dark-green/[0.04] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-dark-green">Net cost to mosque</span>
                  <span
                    className="font-[family-name:var(--font-hero)] text-[32px] leading-none"
                    style={{ color: net <= 0 ? "#1a6b42" : "#0A261E" }}
                  >
                    {net <= 0 ? `+$${Math.abs(net)}` : `$${net}`}
                    <span className="text-[14px] font-normal text-dark-green/40">/mo</span>
                  </span>
                </div>
                {net <= 0 && (
                  <p className="mt-2 text-right text-[13px] font-medium text-[#1a6b42]">
                    {net === 0 ? "Your app is free!" : "Your app generates surplus for the masjid."}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
