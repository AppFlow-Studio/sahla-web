const ABOUT_PARAGRAPH = `The Islamic Society of Bay Ridge, also known as Masjid Musab bin Umayr, has served the Muslim community of Bay Ridge, Brooklyn since 1993. It is one of the first mosques established in Brooklyn. The masjid holds the five daily prayers and Friday khutbah, and runs a weekend school for children, Quran memorization circles, classes for women, and youth programs. It also provides marriage services, family counseling, and support for families in need, and works with neighbors of all faiths across the community.`;

const FACTS = [
  {
    title: "Accessible entrance",
    desc: "Wheelchair access at street level",
  },
  {
    title: "Sisters' prayer area",
    desc: "Dedicated space for women",
  },
  {
    title: "Khutbah screens",
    desc: "Friday sermon on every floor",
  },
];

export default function About() {
  return (
    <section className="section" id="about">
      <div className="wrap">
        <div className="section-head section-head--split">
          <div>
            <span className="label">About the masjid</span>
            <h2 className="section-heading">
              One of the first mosques in Brooklyn.
            </h2>
          </div>
          <div>
            <p className="about__lede">{ABOUT_PARAGRAPH}</p>
            <div className="about__facts">
              {FACTS.map((fact) => (
                <div className="about__fact" key={fact.title}>
                  <p className="about__fact-title">{fact.title}</p>
                  <p className="about__fact-desc">{fact.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
