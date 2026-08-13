"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks, Rocket, CheckCircle,
  Users, Bell, Heart, Megaphone, TrendingUp,
} from "lucide-react";
import AppShowcase from "@/app/components/AppShowcase";

const stats = [
  { Icon: Users, value: "3,500+", label: "Active app users" },
  { Icon: Bell, value: "95%", label: "Push notification reach" },
  { Icon: Heart, value: "$12K+", label: "Donations processed" },
  { Icon: Megaphone, value: "$13K+", label: "Business ad revenue" },
  { Icon: TrendingUp, value: "50+", label: "Programs managed" },
];

const agenda = [
  {
    title: "You reserve your mosque's spot",
    body: "Add your mosque to the list. We onboard new communities in small waves so each one gets real attention — not a queue ticket.",
  },
  {
    title: "We schedule a 15-minute walkthrough",
    body: "When your wave opens, we'll reach out to schedule a short call with your board. We'll mock up your branded app and answer every question your team has.",
  },
  {
    title: "Onboarding kicks off when you're ready",
    body: "If it's a fit, we begin onboarding — your branded app in the App Store, your board trained on the dashboard, and your community connected within weeks.",
  },
];

/**
 * Smooth-scroll to the "How the waitlist works" section. Retries a few
 * times because a hydration remount can briefly leave the target detached
 * from the DOM, and falls back to a raw `window.scrollTo` (with the header
 * offset baked in) if the modern `scrollIntoView` returns falsy.
 */
function scrollToHowItWorks(attempt = 0) {
  const target = document.getElementById("how-it-works");
  if (!target) {
    if (attempt < 4) {
      window.setTimeout(() => scrollToHowItWorks(attempt + 1), 120);
    }
    return;
  }
  try {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    // Older browsers: manual smooth scroll with a header-height offset.
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export default function WaitlistContent() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    mosqueName: "",
    city: "",
    country: "",
    notes: "",
    // Honeypot: hidden from real users, so it should always stay empty. A bot
    // that autofills it gets silently rejected server-side.
    companyWebsite: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "already">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [alreadyMosque, setAlreadyMosque] = useState("");

  // Immersive fullscreen overlay: while the request is in flight → spinning
  // ring, once it resolves → morphs to a check, then dismisses and scrolls
  // the user down to "How the waitlist works". Kept in its own state so the
  // overlay can outlive the raw request timing.
  const [overlayPhase, setOverlayPhase] = useState<"hidden" | "loading" | "success">("hidden");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    setOverlayPhase("loading");
    const overlayStart = Date.now();

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 409 && data?.alreadyJoined) {
          setAlreadyMosque(typeof data.mosqueName === "string" ? data.mosqueName : "");
          setStatus("already");
          setOverlayPhase("hidden");
          return;
        }
        throw new Error(data?.error || "Something went wrong.");
      }

      // Hold the loading ring for a minimum beat so a super-fast response
      // doesn't feel jittery, then transition to the checkmark.
      const held = Date.now() - overlayStart;
      const minLoadingMs = 900;
      if (held < minLoadingMs) {
        await new Promise((r) => setTimeout(r, minLoadingMs - held));
      }
      setOverlayPhase("success");
      setStatus("success");

      // Give the user time to see the checkmark, then fade the overlay and
      // smooth-scroll them down to "How the waitlist works". Defensive:
      // if a hydration remount ate the target briefly, retry a few times
      // before giving up (rare, but a Turbopack RSC-cache race can cause it).
      await new Promise((r) => setTimeout(r, 1200));
      setOverlayPhase("hidden");
      // Wait for the overlay's exit animation to finish so the scroll and
      // the fade don't compete for the user's eye.
      await new Promise((r) => setTimeout(r, 380));
      scrollToHowItWorks();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
      setOverlayPhase("hidden");
    }
  }

  return (
    <>
      <SubmitOverlay phase={overlayPhase} />

      <section id="top" className="bg-[#fffbf2] pt-36 pb-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            {/* Left — info */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-dark-green/40">Reserve Now</p>
              <h1 className="mb-6 font-[family-name:var(--font-hero)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-dark-green">
                Reserve your mosque&apos;s spot.
              </h1>
              <p className="mb-10 max-w-[480px] text-[16px] leading-[1.7] text-dark-green/70">
                We&apos;re onboarding new mosques in waves so each community gets the attention it deserves. Add your masjid to the list — we&apos;ll reach out as your wave opens.
              </p>

              <div className="space-y-5">
                {[
                  { Icon: ListChecks, text: "Reserve your spot — no commitment, no card" },
                  { Icon: Users, text: "Bring your board — we onboard the whole team" },
                  { Icon: Rocket, text: "When your wave opens, we move fast" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3.5">
                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#1a6b42]/10">
                      <item.Icon size={18} strokeWidth={1.7} className="text-[#1a6b42]" />
                    </div>
                    <span className="text-[14px] text-dark-green/70">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — form / success */}
            <motion.div
              className="overflow-hidden rounded-[24px] border border-dark-green/[0.08] bg-white p-8"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              {status === "already" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle size={48} strokeWidth={1.5} className="mb-4 text-[#d4af37]" />
                  <h2 className="mb-2 font-[family-name:var(--font-hero)] text-[24px] text-dark-green">
                    You&apos;re already on the list.
                  </h2>
                  <p className="max-w-[340px] text-[14px] leading-[1.7] text-dark-green/50">
                    {alreadyMosque
                      ? `${alreadyMosque} is already reserved for an upcoming onboarding wave. We'll reach out as soon as your spot opens.`
                      : "Your mosque is already reserved for an upcoming onboarding wave. We'll reach out as soon as your spot opens."}
                  </p>
                </div>
              ) : status === "success" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle size={48} strokeWidth={1.5} className="mb-4 text-[#4a8c65]" />
                  <h2 className="mb-2 font-[family-name:var(--font-hero)] text-[24px] text-dark-green">
                    You&apos;re on the list.
                  </h2>
                  <p className="max-w-[340px] text-[14px] leading-[1.7] text-dark-green/50">
                    Your mosque is reserved for the next onboarding wave. We&apos;ll reach out as soon as your spot opens — usually within a few days.
                  </p>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Honeypot — visually hidden and skipped by keyboard/AT.
                      Real users never fill it; bots that autofill it are
                      silently rejected by /api/waitlist. */}
                  <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden" style={{ opacity: 0 }}>
                    <label htmlFor="company-website">Company website</label>
                    <input
                      id="company-website"
                      type="text"
                      name="companyWebsite"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.companyWebsite}
                      onChange={(e) => update("companyWebsite", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-dark-green/50">Your Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-dark-green/10 bg-dark-green/[0.03] px-4 py-3 text-[14px] text-dark-green placeholder:text-dark-green/25 focus:border-dark-green/20 focus:outline-none"
                      placeholder="Imam Ahmad"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-dark-green/50">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-xl border border-dark-green/10 bg-dark-green/[0.03] px-4 py-3 text-[14px] text-dark-green placeholder:text-dark-green/25 focus:border-dark-green/20 focus:outline-none"
                      placeholder="imam@masjid.org"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-dark-green/50">Phone <span className="text-dark-green/30">(optional)</span></label>
                    <input
                      type="tel"
                      className="w-full rounded-xl border border-dark-green/10 bg-dark-green/[0.03] px-4 py-3 text-[14px] text-dark-green placeholder:text-dark-green/25 focus:border-dark-green/20 focus:outline-none"
                      placeholder="+1 555 123 4567"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-dark-green/50">Mosque Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-dark-green/10 bg-dark-green/[0.03] px-4 py-3 text-[14px] text-dark-green placeholder:text-dark-green/25 focus:border-dark-green/20 focus:outline-none"
                      placeholder="Islamic Center of Your City"
                      value={form.mosqueName}
                      onChange={(e) => update("mosqueName", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-dark-green/50">City</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-dark-green/10 bg-dark-green/[0.03] px-4 py-3 text-[14px] text-dark-green placeholder:text-dark-green/25 focus:border-dark-green/20 focus:outline-none"
                        placeholder="London"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-dark-green/50">Country</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-dark-green/10 bg-dark-green/[0.03] px-4 py-3 text-[14px] text-dark-green placeholder:text-dark-green/25 focus:border-dark-green/20 focus:outline-none"
                        placeholder="United Kingdom"
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-dark-green/50">Anything you&apos;d like us to know?</label>
                    <textarea
                      rows={3}
                      className="w-full resize-none rounded-xl border border-dark-green/10 bg-dark-green/[0.03] px-4 py-3 text-[14px] text-dark-green placeholder:text-dark-green/25 focus:border-dark-green/20 focus:outline-none"
                      placeholder="Congregation size, current tools, questions..."
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-[13px] text-red-400">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full rounded-full bg-dark-green py-3.5 text-[13px] font-semibold text-sand transition-all duration-300 hover:bg-dark-green/90 disabled:opacity-60"
                  >
                    {status === "submitting" ? "Joining..." : "Reserve Now"}
                  </button>
                  <p className="text-center text-[12px] text-dark-green/30">No card required. We&apos;ll reach out as your wave opens.</p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

export function WaitlistExtras() {
  return (
    <>
      {/* What happens after you join the waitlist */}
      <section id="how-it-works" className="scroll-mt-24 bg-[#fffbf2] py-[80px]">
        <div className="mx-auto max-w-[1100px] px-8">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-dark-green/55">
              How the waitlist works
            </p>
            <h2 className="font-[family-name:var(--font-hero)] text-[clamp(28px,3.5vw,42px)] text-dark-green">
              Three steps, no surprises.
            </h2>
            <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.7] text-dark-green/55">
              We&apos;re onboarding new mosques in waves so each one gets the attention it deserves. Here&apos;s what to expect once your spot is reserved.
            </p>
          </motion.div>
          <div className="grid gap-5 lg:grid-cols-3">
            {agenda.map((item, i) => (
              <motion.div
                key={item.title}
                className="rounded-[20px] border border-dark-green/[0.08] bg-white p-7"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1a6b42]/10 text-[13px] font-semibold text-[#1a6b42]">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-[16px] font-semibold leading-[1.35] text-dark-green">
                  {item.title}
                </h3>
                <p className="text-[14px] leading-[1.7] text-dark-green/55">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App showcase — let them see the product before they commit to a call */}
      <AppShowcase />

      {/* Stats */}
      <section className="border-t border-b border-[#d9c4a0]/12 bg-dark-green">
        <div className="mx-auto max-w-[1100px] px-8 py-10">
          <p className="mb-6 text-center text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]/70">
            What one mosque has done with it
          </p>
          <div className="grid grid-cols-2 gap-y-6 lg:grid-cols-5">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <stat.Icon size={20} className="mb-2 text-[#d9c4a0]/60" />
                <span className="font-[family-name:var(--font-hero)] text-[32px] leading-none text-[#d9c4a0]">
                  {stat.value}
                </span>
                <p className="mt-2 max-w-[140px] text-[11px] font-medium uppercase tracking-[0.2em] text-sand/40">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case study card */}
      <section className="bg-[#fffbf2] py-[80px]">
        <div className="mx-auto max-w-[900px] px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-[24px] border border-dark-green/[0.06] bg-dark-green p-10 sm:p-12"
          >
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="mb-3 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">
                  Case study
                </p>
                <h3 className="mb-4 font-[family-name:var(--font-hero)] text-[clamp(24px,2.8vw,32px)] leading-[1.2] text-sand">
                  How MAS Staten Island reached 95% of their community.
                </h3>
                <blockquote className="text-[15px] leading-[1.65] italic text-sand/55">
                  &ldquo;Sahla gave our mosque its own identity in the App Store. Our community finally has one place for prayer times, events, and donations.&rdquo;
                </blockquote>
                <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-sand/45">
                  MAS Staten Island Administration
                </p>
              </div>
              <Link
                href="/customers/mas-si"
                className="inline-flex items-center justify-center rounded-full bg-sand px-6 py-3 text-[13px] font-semibold text-dark-green transition-all duration-300 hover:bg-white"
              >
                Read the case study
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reassurance / second CTA */}
      <section className="bg-dark-green pb-[100px]">
        <div className="mx-auto max-w-[680px] px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-3 font-[family-name:var(--font-hero)] text-[clamp(22px,2.4vw,28px)] text-sand pt-8">
              Spots fill up wave by wave.
            </h3>
            <p className="mb-6 text-[15px] leading-[1.7] text-sand/55">
              Reserve your mosque now so you&apos;re first in line when the next wave opens. No card, no commitment — just a heads-up when it&apos;s your turn.
            </p>
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-full border border-sand/15 px-6 py-3 text-[13px] font-semibold text-sand transition-all duration-300 hover:bg-sand/[0.06]"
            >
              Back to the form
              <span aria-hidden>↑</span>
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}

/**
 * Fullscreen submit overlay. Two phases:
 *  - "loading": a slowly rotating ring with a soft breathing pulse behind
 *    it, so a fast API response still feels "considered".
 *  - "success": the ring completes into a filled emerald disc; a check
 *    strokes into it with a spring; small radial glow lands behind it.
 * Both phases share the same layout so the transition feels like a single
 * continuous animation, not a swap.
 */
function SubmitOverlay({ phase }: { phase: "hidden" | "loading" | "success" }) {
  const visible = phase !== "hidden";
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="waitlist-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fffbf2]/95 backdrop-blur-md"
        >
          {/* Soft ambient glow behind the mark. */}
          <motion.div
            aria-hidden
            className="absolute h-[420px] w-[420px] rounded-full"
            initial={{ opacity: 0.2, scale: 0.85 }}
            animate={{
              opacity: phase === "success" ? 0.55 : 0.25,
              scale: phase === "success" ? 1.05 : 0.9,
            }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background:
                "radial-gradient(closest-side, rgba(74,140,101,0.28), rgba(74,140,101,0) 70%)",
              filter: "blur(6px)",
            }}
          />

          <div className="relative flex flex-col items-center">
            <div className="relative flex h-[140px] w-[140px] items-center justify-center">
              {/* Loading ring */}
              <AnimatePresence>
                {phase === "loading" && (
                  <motion.svg
                    key="loading-ring"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    viewBox="0 0 100 100"
                    className="absolute inset-0 h-full w-full"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="rgba(10,38,30,0.08)"
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="#1a6b42"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="72 220"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
                      style={{ transformOrigin: "50% 50%" }}
                    />
                  </motion.svg>
                )}
              </AnimatePresence>

              {/* Success mark */}
              <AnimatePresence>
                {phase === "success" && (
                  <motion.div
                    key="success-disc"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.25 } }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[#1a6b42] shadow-[0_20px_50px_-15px_rgba(26,107,66,0.45)]">
                      <motion.svg
                        viewBox="0 0 32 32"
                        className="h-14 w-14"
                        fill="none"
                        stroke="#fffbf2"
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.path
                          d="M8 16.5 L14 22 L24 11"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </motion.svg>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              className="mt-8 text-center"
              key={phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-[family-name:var(--font-hero)] text-[22px] leading-tight text-dark-green">
                {phase === "loading"
                  ? "Reserving your spot…"
                  : "You’re on the list."}
              </p>
              <p className="mt-2 text-[13px] text-dark-green/50">
                {phase === "loading"
                  ? "Adding your mosque to the next wave."
                  : "Here’s what happens next."}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
