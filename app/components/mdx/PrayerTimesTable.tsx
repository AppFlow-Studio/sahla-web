export type PrayerTimeRow = {
  name: string;
  adhan: string;
  iqamah?: string;
};

export type PrayerTimesTableProps = {
  mosqueName?: string;
  /** e.g. "Friday, September 19". Freeform — this table is static, not live. */
  date?: string;
  rows: PrayerTimeRow[];
};

/** Directory pages. */
export function PrayerTimesTable({ mosqueName, date, rows }: PrayerTimesTableProps) {
  if (rows.length === 0) return null;

  return (
    <div className="not-prose overflow-x-auto rounded-2xl border border-edge">
      {(mosqueName || date) && (
        <div className="border-b border-edge px-5 py-4">
          {mosqueName && <p className="text-[14px] font-semibold text-ink">{mosqueName}</p>}
          {date && <p className="mt-0.5 text-[12px] text-ink/50">{date}</p>}
        </div>
      )}
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-edge">
            <th className="px-5 py-3 text-[12px] font-semibold tracking-[0.1em] text-ink/50 uppercase">
              Prayer
            </th>
            <th className="px-5 py-3 text-[12px] font-semibold tracking-[0.1em] text-ink/50 uppercase">
              Adhan
            </th>
            <th className="px-5 py-3 text-[12px] font-semibold tracking-[0.1em] text-ink/50 uppercase">
              Iqamah
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.name} className={i > 0 ? "border-t border-edge" : undefined}>
              <td className="px-5 py-3.5 text-[14px] font-medium text-ink">{row.name}</td>
              <td className="px-5 py-3.5 text-[14px] text-ink/70">{row.adhan}</td>
              <td className="px-5 py-3.5 text-[14px] text-ink/70">{row.iqamah ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
