"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Command,
  Sparkles,
  LayoutDashboard,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMosque } from "../_lib/mock-mosque";

const STORAGE_KEY = "sahla.crm.tour_seen.v1";
const EASE = [0.16, 1, 0.3, 1] as const;

// During the UI build phase we want to see the tour on every reload so we can
// iterate on the design quickly. Flip this to true to bring back the
// "show once per browser" behavior backed by localStorage.
const REMEMBER_DISMISSAL = false;

type Step = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
};

export default function FirstLoginTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const mosque = useMosque();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (REMEMBER_DISMISSAL && window.localStorage.getItem(STORAGE_KEY)) return;
    // Tiny delay so the shell has a chance to paint first
    const t = setTimeout(() => setOpen(true), 350);
    return () => clearTimeout(t);
  }, []);

  function complete() {
    if (REMEMBER_DISMISSAL && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setOpen(false);
  }

  function next() {
    if (index === STEPS.length - 1) {
      complete();
      return;
    }
    setDirection(1);
    setIndex((i) => i + 1);
  }

  function back() {
    if (index === 0) return;
    setDirection(-1);
    setIndex((i) => i - 1);
  }

  const STEPS: Step[] = [
    {
      id: "welcome",
      eyebrow: "Welcome",
      title: `As-salāmu ʿalaykum, ${mosque.name}`,
      description:
        "This is your Mosque CRM. Everything you need to run your community — members, events, donations, prayer times — lives in five places.",
      illustration: <WelcomeIllustration />,
    },
    {
      id: "nav",
      eyebrow: "Navigation",
      title: "Five destinations + Settings",
      description:
        "People, Content, Money, Mosque Setup, and Settings. Click into any one and the sub-tabs expand. Nothing is more than two clicks away.",
      illustration: <NavIllustration />,
    },
    {
      id: "first-action",
      eyebrow: "Get started",
      title: "Add a speaker, then create a program",
      description:
        "The fastest path to value: add your imam to People → Speakers, then create your weekly halaqa under Content → Programs. The 5-step wizard walks you through it.",
      illustration: <FirstActionIllustration />,
    },
    {
      id: "cmdk",
      eyebrow: "Power tip",
      title: "Press ⌘K anytime",
      description:
        "The command palette jumps you anywhere — every page, every action. Try it now and search for 'donations' or 'send notification'.",
      illustration: <CmdKIllustration />,
    },
  ];

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? complete() : null)}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[560px]">
        <div className="relative flex flex-col">
          {/* Skip */}
          <button
            type="button"
            onClick={complete}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/40 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
            aria-label="Skip tour"
          >
            <X size={14} />
          </button>

          {/* Illustration */}
          <div className="relative h-56 overflow-hidden bg-gradient-to-b from-[#0A261E] to-[#082019]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #fffbf2 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 16 * direction }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 * direction }}
                transition={{ duration: 0.35, ease: EASE }}
                className="relative flex h-full items-center justify-center"
              >
                {step.illustration}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="space-y-3 px-6 pt-5 pb-2 md:px-8">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#B8922A]">
              {step.eyebrow}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${step.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-display text-[24px] leading-tight text-[#0A261E]">
                  {step.title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#0A261E]/70">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-[#0A261E]/8 px-6 py-4 md:px-8">
            <div className="flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-6 bg-[#0A261E]"
                      : i < index
                      ? "w-1.5 bg-[#B8922A]"
                      : "w-1.5 bg-[#0A261E]/15"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {index > 0 ? (
                <Button variant="ghost" size="sm" onClick={back}>
                  <ArrowLeft size={13} />
                  Back
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={complete}>
                  Skip tour
                </Button>
              )}
              <Button onClick={next}>
                {isLast ? (
                  <>
                    <CheckCircle2 size={14} />
                    Get started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={13} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── illustrations ─── */

function WelcomeIllustration() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#B8922A] shadow-[0_18px_30px_-12px_rgba(184,146,42,0.5)]">
          <Sparkles size={28} className="text-[#0A261E]" />
        </div>
        <motion.div
          aria-hidden
          className="absolute -inset-3 rounded-3xl border border-[#B8922A]/30"
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function NavIllustration() {
  return (
    <div className="grid grid-cols-3 gap-2 px-4">
      {[
        { label: "Home", brass: false },
        { label: "People", brass: true },
        { label: "Content", brass: false },
        { label: "Money", brass: false },
        { label: "Setup", brass: false },
        { label: "Settings", brass: false },
      ].map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.35, ease: EASE }}
          className={`rounded-xl border px-3 py-2 text-[11px] font-medium ${
            item.brass
              ? "border-[#B8922A] bg-[#B8922A]/15 text-[#B8922A]"
              : "border-white/10 bg-white/[0.04] text-[#fffbf2]/70"
          }`}
        >
          {item.label}
        </motion.div>
      ))}
    </div>
  );
}

function FirstActionIllustration() {
  return (
    <div className="space-y-2 px-4">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-[#fffbf2]/85"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B8922A]/20 text-[10px] font-semibold text-[#B8922A]">
          1
        </span>
        Add Sheikh Omar to your speaker registry
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-[#fffbf2]/85"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B8922A]/20 text-[10px] font-semibold text-[#B8922A]">
          2
        </span>
        Create your weekly Friday Halaqa
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center gap-2.5 rounded-xl border border-[#B8922A]/40 bg-[#B8922A]/10 px-3 py-2 text-[12px] text-[#E8D5B0]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B8922A] text-[10px] font-semibold text-[#0A261E]">
          3
        </span>
        Members can RSVP from your app within a minute
      </motion.div>
    </div>
  );
}

function CmdKIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <Command size={18} className="text-[#B8922A]" />
        <div className="font-mono text-[20px] font-semibold tracking-wide text-[#E8D5B0]">
          ⌘ K
        </div>
      </div>
      <div className="mt-3 space-y-1 text-[11.5px] text-[#fffbf2]/65">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={11} />
          Jump to Donations
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={11} className="text-[#B8922A]" />
          Send a notification
        </div>
      </div>
    </motion.div>
  );
}
