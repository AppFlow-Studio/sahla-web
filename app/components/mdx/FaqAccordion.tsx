"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { FAQPageJsonLd } from "../JsonLd";
import { SectionLabel } from "./SectionLabel";

export type FaqItem = { q: string; a: string };

export type FaqAccordionProps = {
  items: FaqItem[];
  /** Optional eyebrow label above the list, e.g. "Common Questions". */
  label?: string;
};

/**
 * /faq and most other pages. Emits its own FAQPage JSON-LD from `items` —
 * content authors don't add schema separately. If a page's frontmatter
 * already sets `schema: "FAQPage"`, don't also drop this in with the same
 * questions, or Google gets two FAQPage blocks for one page.
 */
export function FaqAccordion({ items, label }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="not-prose">
      <FAQPageJsonLd faqs={items} />

      {label && (
        <div className="mb-6">
          <SectionLabel>{label}</SectionLabel>
        </div>
      )}

      <div className="divide-y divide-edge">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[16px] font-medium text-ink">{item.q}</span>
                <IconPlus
                  size={16}
                  stroke={2}
                  className={cn(
                    "shrink-0 transition-transform duration-300",
                    isOpen ? "rotate-45 text-ink" : "text-ink/40"
                  )}
                />
              </button>
              {isOpen && (
                <p className="pb-5 pr-10 text-[14px] leading-[1.75] text-ink/60">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
