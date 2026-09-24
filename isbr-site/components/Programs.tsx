const PROGRAMS = [
  {
    number: "01",
    name: "Weekend School",
    description: "Arabic language and Islamic studies for children.",
  },
  {
    number: "02",
    name: "Quran Memorization",
    description: "Hifz circles guided by the masjid's teachers.",
  },
  {
    number: "03",
    name: "Classes for Women",
    description: "Islamic studies and Quran classes for sisters.",
  },
  {
    number: "04",
    name: "Youth Program",
    description: "Educational, social, and sports activities.",
  },
];

export default function Programs() {
  return (
    <section className="section section--paper" id="programs">
      <div className="wrap">
        <div className="section-head section-head--split section-head--rule">
          <div>
            <span className="label">Programs</span>
            <h2 className="section-heading">Learning, for every age.</h2>
          </div>
          <p className="programs__intro">
            Schedules are set each season. Call the masjid for current days
            and times.
          </p>
        </div>
        <div className="programs-grid">
          {PROGRAMS.map((program) => (
            <div className="program-card" key={program.name}>
              <span className="program-card__number">{program.number}</span>
              <h3 className="program-card__name">{program.name}</h3>
              <p className="program-card__desc">{program.description}</p>
              {/* PLACEHOLDER */}
              <p className="program-card__schedule" data-placeholder="true">
                Schedule: call the masjid.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
