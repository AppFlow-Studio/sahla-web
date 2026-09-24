import { site } from "@/config/site";
import HeroPattern from "./HeroPattern";

const GALLERY = [
  { label: "Exterior" },
  { label: "Prayer Hall" },
  { label: "Entrance" },
];

export default function Hero({
  hijriDate,
  gregorianReadable,
}: {
  hijriDate: string | null;
  gregorianReadable: string | null;
}) {
  return (
    <section className="hero">
      <HeroPattern />
      <div className="wrap hero__inner">
        <div className="hero__arabic-block">
          <p className="hero__masjid-name-arabic" lang="ar">
            {site.masjidNameArabic}
          </p>
          <span className="hero__divider" aria-hidden="true" />
        </div>
        <h1 className="hero__legal-name">{site.legalName}</h1>
        <p className="hero__tagline">
          Serving the Muslim community of Bay Ridge, Brooklyn since{" "}
          {site.foundedYear}.
        </p>
        <div className="hero__meta">
          {gregorianReadable && <span>{gregorianReadable}</span>}
          {hijriDate && <span>{hijriDate}</span>}
        </div>
      </div>
      <div className="hero__gallery">
        {GALLERY.map((item) => (
          <div className="hero__gallery-item" key={item.label}>
            <span className="hero__gallery-label">
              {item.label} &mdash; Photo placeholder
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
