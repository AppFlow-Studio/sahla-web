import type { PrayerData } from "@/lib/prayerTimes";

export default function PrayerTimes({ data }: { data: PrayerData }) {
  return (
    <section className="section section--green" id="prayer-times">
      <div className="wrap">
        <div className="section-head">
          <span className="label label--on-dark">Prayer Times</span>
          <h2 className="section-heading">Prayer Times</h2>
        </div>
        <table className="prayer-table">
          <thead>
            <tr>
              <th>Prayer</th>
              <th>Athan</th>
              <th>Iqamah</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.athan}</td>
                {/* Iqamah times are not yet provided by the masjid. */}
                <td data-placeholder="true">{row.iqamah}</td>
                {/* PLACEHOLDER */}
              </tr>
            ))}
            <tr className="prayer-table__jummah">
              <td>Jummah</td>
              <td data-placeholder="true">{data.jummah.athan}</td>
              {/* PLACEHOLDER */}
              <td data-placeholder="true">{data.jummah.iqamah}</td>
              {/* PLACEHOLDER */}
            </tr>
          </tbody>
        </table>
        <p className="prayer-note" data-placeholder="true">
          {/* PLACEHOLDER */}
          Athan times for Brooklyn, NY (ISNA method). Please call the masjid
          for iqamah and Jummah times.
        </p>
      </div>
    </section>
  );
}
