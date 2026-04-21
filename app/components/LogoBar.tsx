"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
  { value: 50, suffix: "+", label: "Apps Launched" },
  { value: 25, suffix: "K", label: "Active Users" },
  { value: 98, suffix: "%", label: "Uptime" },
  { value: 4.8, suffix: "", label: "App Store Rating", decimal: true },
];

function AnimatedNumber({ value, suffix, decimal }: { value: number; suffix: string; decimal?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(decimal ? parseFloat((value * eased).toFixed(1)) : Math.floor(value * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value, decimal]);

  return (
    <span ref={ref} className="font-[family-name:var(--font-display)] text-4xl text-dark-green lg:text-5xl">
      {decimal ? display.toFixed(1) : display}{suffix}
    </span>
  );
}

export default function LogoBar() {
  return (
    <section className="relative z-10 bg-[#fffbf2] py-16">
      {/* Decorative top border — thin gold line */}
      <div className="absolute top-0 left-1/2 h-[1px] w-40 -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent, #B8922A40, transparent)" }} />

      <div className="mx-auto max-w-5xl px-6">
        <motion.p
          className="mb-10 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-dark-green/25"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Trusted by community centers nationwide
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="relative flex flex-col items-center px-10 py-4 lg:flex-1"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              {/* Vertical separator between stats */}
              {i > 0 && (
                <div className="absolute left-0 top-1/2 hidden h-12 w-[1px] -translate-y-1/2 lg:block" style={{ background: "linear-gradient(180deg, transparent, rgba(10,38,30,0.08), transparent)" }} />
              )}
              <AnimatedNumber value={stat.value} suffix={stat.suffix} decimal={stat.decimal} />
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-dark-green/30">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-1/2 h-[1px] w-40 -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent, #B8922A40, transparent)" }} />
    </section>
  );
}
