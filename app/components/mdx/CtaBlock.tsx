import Link from "next/link";

export type CtaBlockProps = {
  /** Optional eyebrow label, e.g. "Get Started". */
  label?: string;
  heading: string;
  body?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

/** Every page. */
export function CtaBlock({
  label,
  heading,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaBlockProps) {
  return (
    <div className="not-prose rounded-3xl bg-ink px-6 py-12 text-center sm:px-12 sm:py-16">
      {label && (
        <p className="mb-5 text-[11px] font-semibold tracking-[0.28em] text-sand/60 uppercase">
          {label}
        </p>
      )}

      <h2 className="font-[family-name:var(--font-playfair)] text-[clamp(26px,4vw,40px)] leading-[1.15] text-sand">
        {heading}
      </h2>

      {body && (
        <p className="mx-auto mt-4 max-w-[480px] text-[15px] leading-[1.7] text-sand/70">
          {body}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className="rounded-full bg-sand px-7 py-3.5 text-[13px] font-semibold tracking-[0.02em] text-ink transition-transform duration-200 hover:-translate-y-px"
        >
          {primaryLabel}
        </Link>
        {secondaryLabel && secondaryHref && (
          <Link
            href={secondaryHref}
            className="rounded-full border border-sand/20 px-7 py-3.5 text-[13px] font-semibold tracking-[0.02em] text-sand transition-colors duration-200 hover:border-sand/40"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
