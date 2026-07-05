"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, CreditCard, ArrowRight } from "lucide-react";

export default function BackupCardClient() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addBackupCard() {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/mosques/me/backup-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: "onboarding" }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.checkoutUrl) {
        throw new Error(body.error ?? `Couldn't start setup (${res.status}).`);
      }
      window.location.href = body.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setAdding(false);
    }
  }

  function skip() {
    router.push("/launching?payment=success");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#fffbf2] px-6 py-12 text-[#0A261E]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #0A261E 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md rounded-3xl border border-[#0A261E]/8 bg-white px-8 py-10 shadow-[0_18px_40px_-20px_rgba(10,38,30,0.18)] md:px-10 md:py-12"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <ShieldCheck size={26} className="text-emerald-600" strokeWidth={2} />
        </div>

        <p className="mt-6 text-center text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          Payment confirmed
        </p>
        <h1 className="mt-2 text-center font-display text-[26px] leading-tight text-[#0A261E]">
          Add a backup card
        </h1>
        <p className="mt-2 text-center text-[13.5px] leading-relaxed text-[#0A261E]/65">
          Optional, but recommended. If your primary card ever fails, you can
          switch billing to the backup in one click — no service interruption
          while you sort it out.
        </p>

        <div className="mt-6 rounded-xl border border-[#0A261E]/8 bg-[#fffbf2] px-4 py-3 text-[12px] leading-relaxed text-[#0A261E]/60">
          Your backup card is saved on file only. It&apos;s never charged unless
          you make it the primary card.
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-[12px] font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={addBackupCard}
            disabled={adding}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A261E] py-3.5 text-[14px] font-semibold text-[#fffbf2] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <CreditCard size={15} />
            {adding ? "Opening Stripe…" : "Add backup card"}
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={adding}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#0A261E]/12 bg-white py-3.5 text-[13.5px] font-semibold text-[#0A261E] transition-colors hover:bg-[#fffbf2] disabled:opacity-60"
          >
            Skip for now
            <ArrowRight size={13} />
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#0A261E]/40">
          You can add or change your backup card anytime in Settings →
          Subscription.
        </p>
      </motion.div>
    </div>
  );
}
