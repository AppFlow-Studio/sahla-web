const PROGRAMS = [
  {
    name: "Weekend School",
    description: "Arabic language and Islamic studies for children.",
  },
  {
    name: "Quran Memorization Circles",
    description: "Structured hifz circles for students of all levels.",
  },
  {
    name: "Classes for Women",
    description: "Islamic studies and community classes for women.",
  },
  {
    name: "Youth Program",
    description: "Educational, social, and sports activities for youth.",
  },
];

export default function Programs() {
  return (
    <section className="section section--paper" id="programs">
      <div className="wrap">
        <div className="section-head">
          <span className="label">Programs</span>
          <h2 className="section-heading">Programs</h2>
        </div>
        <div className="programs-grid">
          {PROGRAMS.map((program) => (
            <div className="program-card" key={program.name}>
              <h3 className="program-card__name">{program.name}</h3>
              <p className="program-card__desc">{program.description}</p>
              {/* PLACEHOLDER */}
              <p className="program-card__schedule" data-placeholder="true">
                Schedule: please call the masjid.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
