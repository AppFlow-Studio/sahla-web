"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
  { value: 25, suffix: "K", label: "Active Members" },
  { value: 98, suffix: "%", label: "Uptime" },
  { value: 5.0, suffix: "", label: "Store Rating", decimal: true },
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
    <span ref={ref} className="font-[family-name:var(--font-display)] text-[46px] leading-none text-[#d9c4a0]">
      {decimal ? display.toFixed(1) : display}{suffix}
    </span>
  );
}

export default function LogoBar() {
  return (
    <section className="relative border-t border-b border-[#d9c4a0]/12 bg-dark-green">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 px-8 py-10 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="relative flex flex-col items-center px-6 py-3 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
          >
            {/* Vertical separator */}
            {i > 0 && (
              <div
                className="absolute left-0 top-[20%] bottom-[20%] hidden w-[1px] lg:block"
                style={{ background: "linear-gradient(180deg, transparent, rgba(217,196,160,0.14), transparent)" }}
              />
            )}
            <AnimatedNumber value={stat.value} suffix={stat.suffix} decimal={stat.decimal} />
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.25em] text-sand/40">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
