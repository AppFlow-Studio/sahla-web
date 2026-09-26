export type StatCardProps = {
  value: string;
  label: string;
  sublabel?: string;
};

/** Case study pages, homepage. Place several inside a flex/grid wrapper for a row of stats. */
export function StatCard({ value, label, sublabel }: StatCardProps) {
  return (
    <div className="not-prose flex flex-col gap-1.5 rounded-2xl border border-edge bg-card px-6 py-6 text-center sm:text-left">
      <span className="font-[family-name:var(--font-playfair)] text-[clamp(32px,4vw,44px)] leading-none text-ink">
        {value}
      </span>
      <span className="text-[13px] font-medium text-ink/70">{label}</span>
      {sublabel && <span className="text-[12px] text-ink/45">{sublabel}</span>}
    </div>
  );
}
