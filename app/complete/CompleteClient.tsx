"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, ExternalLink, Sliders } from "lucide-react";
import CheckDraw from "@/app/components/CheckDraw";
import BillingPortalButton from "@/app/components/BillingPortalButton";
import UpgradeCrmCard from "@/app/(masjid)/components/UpgradeCrmCard";
import { EASE_OUT_EXPO, EASE_OUT_QUART } from "@/lib/motion";

type Plan = {
  tier: "core" | "core_crm" | null;
  label: string;
  listPrice: string | null;
  interval: string | null;
  status: string | null;
  renewsOn: string | null;
  cancelAtPeriodEnd: boolean;
  discounted: boolean;
  card: { brand: string | null; last4: string | null } | null;
  lastPayment: {
    amount: string;
    date: string;
    receiptUrl: string | null;
    isProration: boolean;
  } | null;
};

const APP_FEATURES = [
  "Your masjid's own app on the App Store and Google Play",
  "Prayer times and iqamah, recalculated every day",
  "Programs, events, and reels your community can browse",
  "Donations paid straight into your own Stripe account",
  "Push notifications for announcements and prayer",
];

const CRM_FEATURES = [
  "A web dashboard your whole team can sign into",
  "Member directory with activity and push status",
  "Donation reporting with anonymized top donors",
  "Notification templates you can reuse and schedule",
];

const NEXT_STEPS = [
  "Our team picks up your submission and prepares the store build.",
  "Everyone you invited gets an email to join the dashboard.",
  "Review usually clears in three to five business days.",
  "We'll email you the moment your app is approved.",
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT_QUART },
  },
};

/** Emerald when billing is healthy, amber when it needs attention. */
function statusTone(status: string | null, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return { label: "Cancels soon", dot: "bg-amber-400", text: "text-amber-200" };
  switch (status) {
    case "active":
    case "trialing":
      return { label: "Active", dot: "bg-emerald-400", text: "text-emerald-300" };
    case "past_due":
    case "unpaid":
    case "incomplete":
      return { label: "Payment needed", dot: "bg-amber-400", text: "text-amber-200" };
    case "canceled":
      return { label: "Cancelled", dot: "bg-stone-400", text: "text-[#fffbf2]/60" };
    default:
      return { label: "Active", dot: "bg-emerald-400", text: "text-emerald-300" };
  }
}

export default function CompleteClient({
  mosqueId,
  mosqueName,
  appName,
  isLive,
  hasCrmAccess,
  plan,
  crmUpgradePrice,
}: {
  mosqueId: string;
  mosqueName: string;
  appName: string | null;
  /** true once the app has shipped; false while it's built but in review. */
  isLive: boolean;
  hasCrmAccess: boolean;
  plan: Plan;
  crmUpgradePrice: string | null;
}) {
  const tone = statusTone(plan.status, plan.cancelAtPeriodEnd);
  const interval = plan.interval ?? "month";

  return (
    <main className="relative min-h-screen bg-[#fffbf2] px-6 py-14 text-[#0A261E]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #0A261E 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <motion.div
        className="relative mx-auto max-w-2xl"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg
              className="absolute inset-0 h-14 w-14 -rotate-90"
              viewBox="0 0 56 56"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="28" cy="28" r="25" stroke="#0A261E" strokeOpacity={0.08} strokeWidth={2.5} />
              <motion.circle
                cx="28"
                cy="28"
                r="25"
                stroke="#B8922A"
                strokeWidth={2.5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.1 }}
              />
            </svg>
            <span className="text-[#B8922A]">
              <CheckDraw size={26} strokeWidth={2.6} delay={0.35} />
            </span>
          </div>

          <div className="min-w-0 pt-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#B8922A]">
              {isLive ? "Your app is live" : "Setup complete"}
            </p>
            <h1 className="mt-1.5 font-display text-[30px] leading-[1.15] text-[#0A261E]">
              {mosqueName} is done setting up
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#0A261E]/65">
              {isLive
                ? `${appName || mosqueName} is published and running on the App Store and Google Play.`
                : `We have everything we need. ${appName || mosqueName} is being built and submitted for review.`}
            </p>
          </div>
        </motion.div>

        {/* The receipt */}
        <motion.section
          variants={fadeUp}
          aria-label="Your plan"
          className="mt-9 overflow-hidden rounded-2xl bg-[#0A261E] text-[#fffbf2] shadow-[0_20px_44px_-24px_rgba(10,38,30,0.5)]"
        >
          <div className="flex items-start justify-between gap-4 px-7 pt-7">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B8922A]">
                Your plan
              </p>
              <p className="mt-1.5 font-display text-[24px] leading-tight text-[#E8D5B0]">
                {plan.label}
              </p>
            </div>
            <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#fffbf2]/8 px-2.5 py-1">
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              <span className={`text-[11px] font-medium ${tone.text}`}>{tone.label}</span>
            </span>
          </div>

          <dl className="mt-6 divide-y divide-[#fffbf2]/8 border-t border-[#fffbf2]/8 px-7 text-[13px]">
            {plan.lastPayment ? (
              <Row label={plan.lastPayment.isProration ? "Plan change" : "You paid"}>
                <span className="font-semibold text-[#fffbf2]">
                  {plan.lastPayment.amount}
                </span>
                <span className="text-[#fffbf2]/45"> on {plan.lastPayment.date}</span>
                {plan.lastPayment.receiptUrl && (
                  <a
                    href={plan.lastPayment.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-[12px] text-[#B8922A] underline-offset-2 hover:underline"
                  >
                    Receipt
                    <ExternalLink size={11} />
                  </a>
                )}
              </Row>
            ) : null}

            {plan.listPrice && (
              <Row label={plan.discounted ? "Plan price" : "Billed"}>
                <span className="font-semibold text-[#fffbf2]">
                  {plan.listPrice}
                </span>
                <span className="text-[#fffbf2]/45"> / {interval}</span>
                {plan.discounted && (
                  <span className="ml-2 rounded-full bg-[#B8922A]/18 px-2 py-0.5 text-[11px] font-medium text-[#E8D5B0]">
                    Discount applied
                  </span>
                )}
              </Row>
            )}

            {plan.renewsOn && (
              <Row label={plan.cancelAtPeriodEnd ? "Access until" : "Renews"}>
                <span className="text-[#fffbf2]/80">{plan.renewsOn}</span>
              </Row>
            )}

            {plan.card?.last4 && (
              <Row label="Card">
                <span className="text-[#fffbf2]/80">
                  {plan.card.brand
                    ? plan.card.brand.charAt(0).toUpperCase() + plan.card.brand.slice(1)
                    : "Card"}{" "}
                  ···· {plan.card.last4}
                </span>
              </Row>
            )}
          </dl>

          <div className="px-7 pb-7 pt-6">
            <BillingPortalButton
              mosqueId={mosqueId}
              label="Manage billing"
              className="inline-flex items-center gap-2 rounded-lg border border-[#fffbf2]/15 px-4 py-2 text-[12.5px] font-medium text-[#fffbf2] transition-colors hover:bg-[#fffbf2]/8 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </motion.section>

        {/* What the money buys */}
        <motion.section variants={fadeUp} className="mt-10" aria-label="What's included">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0A261E]/45">
            What you get
          </h2>
          <ul className="mt-4 space-y-2.5">
            {APP_FEATURES.map((f) => (
              <Feature key={f}>{f}</Feature>
            ))}
            {plan.tier === "core_crm" &&
              CRM_FEATURES.map((f) => <Feature key={f}>{f}</Feature>)}
          </ul>
        </motion.section>

        {/* Only while the build is still in flight */}
        {!isLive && (
          <motion.section variants={fadeUp} className="mt-10" aria-label="What happens next">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0A261E]/45">
              What happens next
            </h2>
            <ol className="mt-4 space-y-3.5">
              {NEXT_STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-3.5">
                  <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A261E]/6 text-[10.5px] font-semibold tabular-nums text-[#0A261E]/55">
                    {i + 1}
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-[#0A261E]/70">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </motion.section>
        )}

        {/* Where to go from here */}
        <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-2.5 sm:flex-row">
          {hasCrmAccess ? (
            <Link
              href="/home"
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A261E] px-5 py-3.5 text-[13.5px] font-semibold text-[#fffbf2] transition-opacity hover:opacity-90"
            >
              Open your dashboard
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ) : (
            <Link
              href="/mosque_profile"
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0A261E] px-5 py-3.5 text-[13.5px] font-semibold text-[#fffbf2] transition-opacity hover:opacity-90"
            >
              <Sliders size={14} />
              Edit your app content
            </Link>
          )}
          <a
            href="mailto:support@sahla.co"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0A261E]/12 bg-white px-5 py-3.5 text-[13.5px] font-medium text-[#0A261E]/70 transition-colors hover:bg-white/60 hover:text-[#0A261E]"
          >
            Email support
          </a>
        </motion.div>

        {plan.tier === "core" && (
          <motion.div variants={fadeUp} className="mt-8">
            <UpgradeCrmCard mosqueId={mosqueId} priceLabel={crmUpgradePrice} />
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5">
      <dt className="text-[#fffbf2]/45">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[#0A261E]/75">
      <Check size={14} strokeWidth={2.5} className="mt-1 shrink-0 text-[#B8922A]" />
      {children}
    </li>
  );
}
