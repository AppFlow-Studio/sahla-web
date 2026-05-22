"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, ArrowRight, RefreshCcw } from "lucide-react";

type Phase = "polling" | "ready" | "stuck" | "cancelled";

const POLL_MS = 2000;
const MAX_POLLS = 30; // ~60 seconds

export default function GoLiveClient() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentParam = params.get("payment");
  const [phase, setPhase] = useState<Phase>(
    paymentParam === "cancelled" ? "cancelled" : "polling"
  );
  const [mosqueName, setMosqueName] = useState<string | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    if (phase !== "polling") return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/mosques/me/status", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) schedule();
          return;
        }
        const body = (await res.json()) as {
          status?: string;
          name?: string | null;
        };
        if (cancelled) return;

        if (body.name) setMosqueName(body.name);

        if (body.status === "ready" || body.status === "live") {
          setPhase("ready");
          // Brief celebratory pause before routing, so the green check is visible
          window.setTimeout(() => {
            router.push("/home");
          }, 800);
          return;
        }

        schedule();
      } catch {
        if (!cancelled) schedule();
      }
    }

    function schedule() {
      pollCountRef.current += 1;
      if (pollCountRef.current >= MAX_POLLS) {
        setPhase("stuck");
        return;
      }
      window.setTimeout(poll, POLL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [phase, router]);

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
      <div className="relative w-full max-w-md">
        {phase === "polling" ? (
          <PollingCard mosqueName={mosqueName} />
        ) : phase === "ready" ? (
          <ReadyCard mosqueName={mosqueName} />
        ) : phase === "cancelled" ? (
          <CancelledCard />
        ) : (
          <StuckCard />
        )}
      </div>
    </div>
  );
}

function PollingCard({ mosqueName }: { mosqueName: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-[#0A261E]/8 bg-white px-8 py-10 text-center shadow-[0_18px_40px_-20px_rgba(10,38,30,0.18)] md:px-10 md:py-12"
    >
      <div className="relative mx-auto h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#B8922A]/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#B8922A]"
          style={{ borderRightColor: "transparent", borderBottomColor: "transparent" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-2 rounded-full bg-[#B8922A]/10" />
      </div>

      <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#B8922A]">
        Payment received
      </p>
      <h1 className="mt-2 font-display text-[26px] leading-tight text-[#0A261E]">
        Setting up your CRM…
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#0A261E]/65">
        {mosqueName ? (
          <>
            We&apos;re finishing the setup for{" "}
            <span className="font-semibold text-[#0A261E]">{mosqueName}</span>.
            This usually takes 5–10 seconds.
          </>
        ) : (
          "We're finishing your setup. This usually takes 5–10 seconds."
        )}
      </p>
    </motion.div>
  );
}

function ReadyCard({ mosqueName }: { mosqueName: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl border border-emerald-200 bg-white px-8 py-10 text-center shadow-[0_18px_40px_-20px_rgba(10,38,30,0.18)] md:px-10 md:py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3, type: "spring", stiffness: 300 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
      >
        <CheckCircle2 size={28} className="text-emerald-600" strokeWidth={2} />
      </motion.div>
      <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
        You&apos;re live
      </p>
      <h1 className="mt-2 font-display text-[26px] leading-tight text-[#0A261E]">
        {mosqueName ? `${mosqueName} is set up` : "You're set up"}
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#0A261E]/65">
        Redirecting you to your CRM dashboard…
      </p>
    </motion.div>
  );
}

function CancelledCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-[#0A261E]/8 bg-white px-8 py-10 text-center md:px-10 md:py-12"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <AlertCircle size={26} className="text-amber-600" strokeWidth={1.8} />
      </div>
      <h1 className="mt-5 font-display text-[24px] leading-tight text-[#0A261E]">
        Checkout cancelled
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#0A261E]/65">
        No worries — your progress is saved. Pick up where you left off whenever you&apos;re ready.
      </p>
      <Link
        href="/go_live"
        className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0A261E] px-4 py-2.5 text-[13px] font-semibold text-[#fffbf2] transition-opacity hover:opacity-90"
      >
        Back to launch
        <ArrowRight size={13} />
      </Link>
    </motion.div>
  );
}

function StuckCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-[#0A261E]/8 bg-white px-8 py-10 text-center md:px-10 md:py-12"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fffbf2]">
        <RefreshCcw size={22} className="text-[#B8922A]" strokeWidth={1.8} />
      </div>
      <h1 className="mt-5 font-display text-[22px] leading-tight text-[#0A261E]">
        This is taking longer than expected
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#0A261E]/65">
        Stripe sometimes takes a minute to confirm. Refresh in a moment, or contact us if it persists.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0A261E] px-4 py-2.5 text-[13px] font-semibold text-[#fffbf2] transition-opacity hover:opacity-90"
        >
          <RefreshCcw size={13} />
          Refresh
        </button>
        <a
          href="mailto:support@sahla.co"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0A261E]/12 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0A261E] transition-colors hover:bg-[#fffbf2]"
        >
          Email support
        </a>
      </div>
    </motion.div>
  );
}
