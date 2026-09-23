import Image from "next/image";
import { site } from "@/config/site";
import HeroPattern from "./HeroPattern";

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
        <div>
          <span className="label label--on-dark hero__eyebrow">
            {site.shortName} &middot; Bay Ridge, Brooklyn
          </span>
          <h1 className="hero__legal-name">{site.legalName}</h1>
          <p className="hero__masjid-name">{site.masjidName}</p>
          <p className="hero__masjid-name-arabic" lang="ar">
            {site.masjidNameArabic}
          </p>
          <p className="hero__tagline">
            Serving the Bay Ridge, Brooklyn community since {site.foundedYear}
            .
          </p>
          <div className="hero__meta">
            {gregorianReadable && (
              <span>
                <strong>Today</strong> &nbsp;{gregorianReadable}
              </span>
            )}
            {hijriDate && (
              <span>
                <strong>Hijri date</strong> &nbsp;{hijriDate}
              </span>
            )}
          </div>
        </div>
        <div className="hero__photo">
          <Image
            src="/hero.jpg"
            alt="Islamic Society of Bay Ridge"
            width={1600}
            height={900}
            priority
            data-placeholder="true" // PLACEHOLDER
          />
        </div>
      </div>
    </section>
  );
}
