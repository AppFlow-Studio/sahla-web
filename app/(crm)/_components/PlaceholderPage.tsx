"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "./PageHeader";
import ComingSoonBadge from "./ComingSoonBadge";

type Props = {
  /** Section name (eyebrow) */
  section: string;
  /** Page title */
  title: string;
  /** What this page will eventually do */
  description: string;
  /** Bullets explaining the eventual feature set */
  bullets?: string[];
  /** When true the placeholder reads as "deferred" instead of "next up" */
  comingSoon?: boolean;
  /** Approximate ship target ("Q3 2026") */
  shipTarget?: string;
  /** Where the "request early access" link goes */
  feedbackHref?: string;
};

export default function PlaceholderPage({
  section,
  title,
  description,
  bullets,
  comingSoon = false,
  shipTarget,
  feedbackHref = "/settings/sahla-support",
}: Props) {
  return (
    <>
      <PageHeader
        eyebrow={section}
        title={title}
        description={description}
        action={
          comingSoon ? (
            <Link href={feedbackHref}>
              <Button variant="outline">
                <MessageSquareText size={14} />
                Request early access
              </Button>
            </Link>
          ) : null
        }
      />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-[#0A261E]/8 bg-white p-8 md:p-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #0A261E 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2">
            {comingSoon ? <ComingSoonBadge /> : (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                In progress
              </span>
            )}
            {shipTarget ? (
              <span className="text-[11px] text-[#0A261E]/45">
                Targeting {shipTarget}
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 max-w-xl font-display text-[26px] leading-tight text-[#0A261E] md:text-[28px]">
            {comingSoon
              ? `${title} is coming soon.`
              : `${title} is being built.`}
          </h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#0A261E]/65">
            {comingSoon
              ? "We're shipping this in a future release. In the meantime you can tell us how you'd use it — that shapes what we build first."
              : "This screen is part of the ongoing CRM build. The data hooks and primitives are in place; the UI is being polished module-by-module."}
          </p>

          {bullets && bullets.length > 0 ? (
            <ul className="mt-6 grid gap-2 text-[13.5px] text-[#0A261E]/75 md:grid-cols-2">
              {bullets.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-[#0A261E]/6 bg-[#fffbf2] px-3 py-2.5"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8922A]"
                  />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {comingSoon ? (
            <Link
              href={feedbackHref}
              className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0A261E] hover:text-[#0A261E]/70"
            >
              Tell us how you'd use it <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>
      </motion.section>
    </>
  );
}
