import { site } from "@/config/site";

const ABOUT_PARAGRAPH = `The Islamic Society of Bay Ridge, also known as Masjid Musab bin Umayr, has served the Muslim community of Bay Ridge, Brooklyn since 1993. It is one of the first mosques established in Brooklyn. The masjid holds the five daily prayers and Friday khutbah, and runs a weekend school for children, Quran memorization circles, classes for women, and youth programs. It also provides marriage services, family counseling, and support for families in need, and works with neighbors of all faiths across the community.`;

const FACTS = [
  "Sunni mosque, 501(c)(3) religious nonprofit",
  `Est. ${site.foundedYear}`,
  "Wheelchair accessible entrance",
  "Women's prayer area",
  "Friday khutbah screens",
];

export default function About() {
  return (
    <section className="section" id="about">
      <div className="wrap">
        <div className="section-head">
          <span className="label">About</span>
          <h2 className="section-heading">About {site.commonName}</h2>
        </div>
        <div className="about__body">
          <p className="about__lede">{ABOUT_PARAGRAPH}</p>
        </div>
        <div className="about__facts">
          {FACTS.map((fact) => (
            <span className="about__fact" key={fact}>
              {fact}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
