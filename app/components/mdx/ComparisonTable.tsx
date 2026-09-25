import { IconCheck, IconX } from "@tabler/icons-react";

export type ComparisonCell = boolean | string;

export type ComparisonRow = {
  feature: string;
  sahla: ComparisonCell;
  competitor: ComparisonCell;
};

export type ComparisonTableProps = {
  /** Name of the competitor being compared against, e.g. "Masjidal". */
  competitorName: string;
  rows: ComparisonRow[];
};

function Cell({ value }: { value: ComparisonCell }) {
  if (typeof value === "string") {
    return <span className="text-[14px] text-ink/80">{value}</span>;
  }
  if (value) {
    return <IconCheck size={18} stroke={2.5} className="text-ink" aria-label="Yes" />;
  }
  return <IconX size={18} stroke={2.5} className="text-ink/25" aria-label="No" />;
}

/** 7 competitor comparison pages (/vs/<competitor>). */
export function ComparisonTable({ competitorName, rows }: ComparisonTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className="not-prose overflow-x-auto rounded-2xl border border-edge">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-edge">
            <th className="w-[40%] px-5 py-4 text-[12px] font-semibold tracking-[0.1em] text-ink/50 uppercase">
              Feature
            </th>
            <th className="px-5 py-4 text-[13px] font-semibold text-ink">
              <span className="inline-flex items-center gap-1.5">
                Sahla
                <span className="size-1.5 rounded-full bg-gold" aria-hidden />
              </span>
            </th>
            <th className="px-5 py-4 text-[13px] font-semibold text-ink/60">{competitorName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.feature} className={i > 0 ? "border-t border-edge" : undefined}>
              <td className="px-5 py-4 text-[14px] text-ink/80">{row.feature}</td>
              <td className="bg-ink/[0.025] px-5 py-4">
                <Cell value={row.sahla} />
              </td>
              <td className="px-5 py-4">
                <Cell value={row.competitor} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
