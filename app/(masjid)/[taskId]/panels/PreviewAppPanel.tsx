"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Check, Play } from "lucide-react";
import PhoneCarousel from "@/app/components/PhoneCarousel";
import { cn } from "@/lib/utils";

type MosqueData = {
  id: string;
  name: string | null;
  app_name: string | null;
  brand_color: string | null;
};

type Counts = {
  speakers: number;
  programs: number;
  events: number;
  jummahSlots: number;
  prayersConfigured: number;
  stripeConnected: boolean;
};

type BuildStep = {
  doing: string;
  done: string;
};

const STEP_DURATION_MS = 2000;

function buildSteps(mosque: MosqueData, counts: Counts): BuildStep[] {
  const steps: BuildStep[] = [];
  const displayName = mosque.app_name || mosque.name || "your mosque";

  steps.push({
    doing: "Loading mosque profile...",
    done: `Loaded ${displayName}`,
  });

  if (mosque.brand_color) {
    steps.push({
      doing: "Applying brand identity...",
      done: `Set brand color to ${mosque.brand_color}`,
    });
  }

  if (counts.prayersConfigured >= 5) {
    steps.push({
      doing: "Calculating prayer times...",
      done: "Configured 5 daily prayer schedules",
    });
  }

  if (counts.jummahSlots > 0) {
    steps.push({
      doing: "Setting up Jummah...",
      done: `Added ${counts.jummahSlots} Jummah ${counts.jummahSlots === 1 ? "slot" : "slots"}`,
    });
  }

  if (counts.speakers > 0) {
    steps.push({
      doing: "Importing speakers...",
      done: `Imported ${counts.speakers} ${counts.speakers === 1 ? "speaker" : "speakers"}`,
    });
  }

  if (counts.programs > 0) {
    steps.push({
      doing: "Building program cards...",
      done: `Added ${counts.programs} ${counts.programs === 1 ? "program" : "programs"}`,
    });
  }

  if (counts.events > 0) {
    steps.push({
      doing: "Scheduling events...",
      done: `Scheduled ${counts.events} upcoming ${counts.events === 1 ? "event" : "events"}`,
    });
  }

  if (counts.stripeConnected) {
    steps.push({
      doing: "Connecting payment system...",
      done: "Stripe account linked",
    });
  }

  steps.push({
    doing: "Compiling app bundle...",
    done: "Build complete",
  });

  return steps;
}

export default function PreviewAppPanel({
  mosque,
  counts,
}: {
  mosque: MosqueData;
  counts: Counts;
}) {
  const [phase, setPhase] = useState<"idle" | "building" | "ready">("idle");
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => buildSteps(mosque, counts), [mosque, counts]);

  useEffect(() => {
    if (phase !== "building") return;
    if (currentStep >= steps.length) {
      const t = setTimeout(() => setPhase("ready"), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCurrentStep((s) => s + 1), STEP_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, currentStep, steps.length]);

  function startBuild() {
    setCurrentStep(0);
    setPhase("building");
  }

  function rebuild() {
    setPhase("idle");
    setCurrentStep(0);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
        <p className="text-[14px] font-semibold text-stone-900">Live Preview</p>
        <p className="mt-0.5 text-[12px] text-stone-500">
          See exactly what your users will experience in the app.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Idle ─── */}
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center justify-center px-6 py-16 text-center"
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-900 to-stone-700 text-3xl shadow-lg">
              🕌
            </div>
            <h3 className="text-[16px] font-semibold text-stone-900">
              Ready to see your app?
            </h3>
            <p className="mt-1.5 max-w-sm text-[13px] text-stone-500">
              We&apos;ll assemble your live preview using everything you&apos;ve set up so far —
              prayer times, programs, speakers, and more.
            </p>
            <button
              onClick={startBuild}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow-md"
            >
              <Play size={14} fill="currentColor" strokeWidth={0} />
              Generate Live Preview
            </button>
          </motion.div>
        )}

        {/* ─── Building ─── */}
        {phase === "building" && (
          <motion.div
            key="building"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-6 py-8"
          >
            <div className="mx-auto max-w-md rounded-xl border border-stone-800 bg-[#0a1410] p-5 font-mono shadow-inner">
              <div className="mb-4 flex items-center gap-2 border-b border-stone-800 pb-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <span className="ml-2 text-[10px] uppercase tracking-wider text-stone-500">
                  sahla build
                </span>
                <Sparkles size={11} className="ml-auto text-amber-300/80" />
              </div>

              <div className="space-y-2">
                {steps.map((step, i) => {
                  const isDone = i < currentStep;
                  const isActive = i === currentStep;
                  const isFuture = i > currentStep;
                  if (isFuture) return null;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {isDone ? (
                          <Check size={13} className="text-emerald-400" strokeWidth={3} />
                        ) : (
                          <Loader2 size={13} className="animate-spin text-amber-300" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[12px] leading-snug",
                          isDone ? "text-stone-400" : "text-stone-200"
                        )}
                      >
                        {isActive ? step.doing : step.done}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Ready ─── */}
        {phase === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-night px-6 py-12"
          >
            <PhoneCarousel demoMode={false} />
            <div className="mt-8 flex justify-center">
              <button
                onClick={rebuild}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-medium text-white/70 backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Rebuild Preview
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
