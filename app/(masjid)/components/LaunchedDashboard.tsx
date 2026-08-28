"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Smartphone } from "lucide-react";
import UpgradeCrmCard from "./UpgradeCrmCard";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/**
 * Landing view for a mosque that has finished onboarding but has no CRM
 * access (Sahla Core plan). Without this they'd fall through to the
 * onboarding checklist, which reads as "you still have work to do" when in
 * fact their app has shipped.
 */
export default function LaunchedDashboard({
  mosqueName,
  mosqueId,
  isLive,
  priceLabel,
}: {
  mosqueName: string;
  mosqueId: string;
  /** true once the app is live; false while it's built but not yet shipped. */
  isLive: boolean;
  priceLabel: string | null;
}) {
  return (
    <motion.div
      className="mx-auto max-w-2xl py-12"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-stone-900">
            {isLive ? "Your app is live" : "Setup complete"}
          </h1>
          <p className="mt-0.5 text-[14px] text-stone-500">
            {isLive
              ? `${mosqueName}'s app is published and running.`
              : `${mosqueName} is set up — your app is being published.`}
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="mt-6 rounded-xl border border-stone-200 bg-white px-6 py-5"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100">
            <Smartphone size={17} className="text-stone-500" />
          </div>
          <div>
            <p className="text-[13.5px] font-semibold text-stone-900">
              Your plan: Sahla Core
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-stone-500">
              Prayer times, programs, events, and donations all run inside your mosque&apos;s
              app. Day-to-day updates are handled from the app&apos;s admin screens — no web
              dashboard is included on this plan.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-6">
        <UpgradeCrmCard mosqueId={mosqueId} priceLabel={priceLabel} />
      </motion.div>

      <motion.p variants={fadeUp} className="mt-6 text-center text-[12px] text-stone-400">
        Need something changed on your app? Email{" "}
        <a href="mailto:support@sahla.co" className="underline hover:text-stone-600">
          support@sahla.co
        </a>
        .
      </motion.p>
    </motion.div>
  );
}
