"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Shield, CheckCircle } from "lucide-react";

export default function DemoContent() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mosqueName: "",
    city: "",
    country: "",
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
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
      <section className="bg-dark-green pt-36 pb-20">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            {/* Left — info */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">Request a Demo</p>
              <h1 className="mb-6 font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-sand">
                See what Sahla can build for your mosque.
              </h1>
              <p className="mb-10 max-w-[480px] text-[16px] leading-[1.7] text-sand/50">
                Book a 15-minute call with our team. We&apos;ll walk you through the platform, answer your questions, and show you what your community&apos;s app could look like.
              </p>

              <div className="space-y-5">
                {[
                  { Icon: Clock, text: "15-minute call — we respect your time" },
                  { Icon: Users, text: "Bring your board members — we'll answer their questions too" },
                  { Icon: Shield, text: "No commitment, no pressure, no sales pitch" },
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
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle size={48} strokeWidth={1.5} className="mb-4 text-[#4a8c65]" />
                  <h2 className="mb-2 font-[family-name:var(--font-display)] text-[24px] text-sand">
                    We&apos;ll be in touch!
                  </h2>
                  <p className="max-w-[320px] text-[14px] leading-[1.7] text-sand/50">
                    Thank you for your interest. Our team will reach out within 24 hours to schedule your demo.
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
                    {status === "submitting" ? "Submitting..." : "Request a Demo"}
                  </button>
                  <p className="text-center text-[12px] text-sand/30">We&apos;ll respond within 24 hours.</p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
