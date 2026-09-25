import Image from "next/image";
import { site } from "@/config/site";
import HeroPattern from "./HeroPattern";

const GALLERY = [
  {
    label: "Exterior",
    src: "/gallery/exterior.jpg",
    alt: "Storefront of the Islamic Society of Bay Ridge on 5th Avenue",
  },
  {
    label: "Community Prayer",
    src: "/gallery/day-of-prayer.webp",
    alt: "Community gathered for a day of prayer at the Islamic Society of Bay Ridge",
  },
  {
    label: "Entrance",
    src: "/gallery/entrance.jpg",
    alt: "Entrance and signage of the Islamic Society of Bay Ridge at 6807 5th Ave",
  },
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
            <Image
              className="hero__gallery-img"
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 720px) 100vw, 33vw"
            />
            <span className="hero__gallery-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
