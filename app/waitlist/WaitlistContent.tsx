"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

export default function WaitlistContent() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    mosqueName: "",
    city: "",
    country: "",
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "already">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [alreadyMosque, setAlreadyMosque] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

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
          return;
        }
        throw new Error(data?.error || "Something went wrong.");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-sand/10 bg-sand/[0.04] px-4 py-3 text-[14px] text-sand placeholder:text-sand/25 focus:border-sand/20 focus:outline-none";

  return (
    <>
      <section id="top" className="bg-dark-green pt-36 pb-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            {/* Left — info */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">Join the Waitlist</p>
              <h1 className="mb-6 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-sand">
                Reserve your mosque&apos;s spot.
              </h1>
              <p className="mb-10 max-w-[480px] text-[16px] leading-[1.7] text-sand/50">
                We&apos;re onboarding new mosques in waves so each community gets the attention it deserves. Add your masjid to the list — we&apos;ll reach out as your wave opens.
              </p>

              <div className="space-y-5">
                {[
                  { Icon: ListChecks, text: "Reserve your spot — no commitment, no card" },
                  { Icon: Users, text: "Bring your board — we onboard the whole team" },
                  { Icon: Rocket, text: "When your wave opens, we move fast" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3.5">
                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#1a6b42]/20">
                      <item.Icon size={18} strokeWidth={1.7} className="text-[#4a8c65]" />
                    </div>
                    <span className="text-[14px] text-sand/60">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — form / success */}
            <motion.div
              className="overflow-hidden rounded-[24px] border border-sand/[0.08] p-8"
              style={{ background: "linear-gradient(180deg, rgba(255,251,242,0.03), rgba(255,251,242,0.01))" }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              {status === "already" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle size={48} strokeWidth={1.5} className="mb-4 text-[#d4af37]" />
                  <h2 className="mb-2 font-[family-name:var(--font-display)] text-[24px] text-sand">
                    You&apos;re already on the list.
                  </h2>
                  <p className="max-w-[340px] text-[14px] leading-[1.7] text-sand/50">
                    {alreadyMosque
                      ? `${alreadyMosque} is already reserved for an upcoming onboarding wave. We'll reach out as soon as your spot opens.`
                      : "Your mosque is already reserved for an upcoming onboarding wave. We'll reach out as soon as your spot opens."}
                  </p>
                </div>
              ) : status === "success" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle size={48} strokeWidth={1.5} className="mb-4 text-[#4a8c65]" />
                  <h2 className="mb-2 font-[family-name:var(--font-display)] text-[24px] text-sand">
                    You&apos;re on the list.
                  </h2>
                  <p className="max-w-[340px] text-[14px] leading-[1.7] text-sand/50">
                    Your mosque is reserved for the next onboarding wave. We&apos;ll reach out as soon as your spot opens — usually within a few days.
                  </p>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Your Name</label>
                    <input
                      type="text"
                      required
                      className={inputClass}
                      placeholder="Imam Ahmad"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Email</label>
                    <input
                      type="email"
                      required
                      className={inputClass}
                      placeholder="imam@masjid.org"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Phone <span className="text-sand/30">(optional)</span></label>
                    <input
                      type="tel"
                      className={inputClass}
                      placeholder="+1 555 123 4567"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Mosque Name</label>
                    <input
                      type="text"
                      required
                      className={inputClass}
                      placeholder="Islamic Center of Your City"
                      value={form.mosqueName}
                      onChange={(e) => update("mosqueName", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">City</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="London"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Country</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="United Kingdom"
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-medium tracking-wide text-sand/50">Anything you&apos;d like us to know?</label>
                    <textarea
                      rows={3}
                      className={`${inputClass} resize-none`}
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
                    className="w-full rounded-full bg-sand py-3.5 text-[13px] font-semibold text-dark-green transition-all duration-300 hover:bg-sand/90 disabled:opacity-60"
                  >
                    {status === "submitting" ? "Joining..." : "Join the Waitlist"}
                  </button>
                  <p className="text-center text-[12px] text-sand/30">No card required. We&apos;ll reach out as your wave opens.</p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* What happens after you join the waitlist */}
      <section className="bg-[#fffbf2] py-[80px]">
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
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,42px)] text-dark-green">
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
                <span className="font-[family-name:var(--font-display)] text-[32px] leading-none text-[#d9c4a0]">
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
                <h3 className="mb-4 font-[family-name:var(--font-display)] text-[clamp(24px,2.8vw,32px)] leading-[1.2] text-sand">
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
            <h3 className="mb-3 font-[family-name:var(--font-display)] text-[clamp(22px,2.4vw,28px)] text-sand pt-8">
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
