"use client";

import { useEffect, useRef } from "react";
import styles from "./AboutContent.module.css";

function Ornament() {
  return (
    <div className={`${styles.ornament} ${styles.reveal}`} aria-hidden="true" data-reveal>
      <span className={styles.ornamentLine} />
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0l2.4 7.2L22 8l-5.5 5.4L18 22l-6-3.8L6 22l1.5-8.6L2 8l7.6-.8L12 0z" />
      </svg>
      <span className={styles.ornamentLine} />
    </div>
  );
}

export default function AboutContent() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.inView);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={styles.root}>
      {/* ============== HERO ============== */}
      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>A letter from the founder</div>
        <h1 className={styles.heroTitle}>
          Sahla wasn&apos;t my <em>first</em> thought.
        </h1>
        <p className={styles.heroLede}>
          I didn&apos;t even know how to code when this started. I wasn&apos;t trying to build a company. I was trying to solve my own problem.
        </p>
        <div className={styles.heroMeta}>
          <span>New York, NY</span>
        </div>
      </section>

      <Ornament />

      {/* ============== ARTICLE ============== */}
      <article className={styles.article}>
        <section className={`${styles.section} ${styles.opening} ${styles.reveal}`} data-reveal>
          <p>
            I&apos;d come off social media, and the only way I had left to keep up with my local masjid was a handful of WhatsApp groupchats. The notifications were unmanageable. I muted them. And then I lost touch — with the classes, the events, the small things that hold a community together. I figured I couldn&apos;t be the only one feeling that.
          </p>
          <p>
            So my co-founder and I decided to learn. The first version of what would eventually become Sahla wasn&apos;t a product. It was a resume project. We were going to make an app for the two of us — a single mosque&apos;s information, in a single place, without the noise.
          </p>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} data-reveal>
          <h2>
            The lecture that <em>changed</em> the project.
          </h2>
          <p>While we were building, my local sheikh gave a talk that I haven&apos;t been able to shake.</p>
          <p>
            His point was simple: Muslims should give back to the masjid and the community in the areas they&apos;re specializing in. Money is good. Money matters. But it isn&apos;t the only currency.
          </p>

          <blockquote className={styles.pullquote}>
            If you&apos;re studying medicine, the community needs your medicine. If you&apos;re studying law, the community needs your law. And if you&apos;re learning to build software, the community needs you to build for it.
          </blockquote>

          <p>
            I sat with that for a long time. The app I was working on was for two users. By the end of that week, I&apos;d thrown out the brief.
          </p>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} data-reveal>
          <h2>
            From a personal problem to a <em>community</em> one.
          </h2>
          <p>
            We rebuilt it as something that could serve the whole masjid — not just me. Prayer times, programs, events, lectures, donations, the things people actually opened their phone for during the day. We pushed through every wall we hit. Neither of us had any business doing this; we figured it out anyway.
          </p>
          <p>When we launched, I expected family and a couple of close friends.</p>

          <div className={`${styles.growth} ${styles.reveal}`} data-reveal>
            <div className={styles.growthStep}>
              <div className={styles.growthNum}>100</div>
              <div className={styles.growthLabel}>First Month</div>
            </div>
            <div className={styles.growthStep}>
              <div className={styles.growthNum}>500</div>
              <div className={styles.growthLabel}>By Quarter Two</div>
            </div>
            <div className={styles.growthStep}>
              <div className={styles.growthNum}>3,500+</div>
              <div className={styles.growthLabel}>Within One Year</div>
            </div>
          </div>

          <p>
            And then the calls started. Imams from other masjids had heard about what we&apos;d built and wanted the same thing for their own communities. Not a page inside ours. Not a stripped-down version.
          </p>

          <p className={styles.emphasisLine}>The same thing — but for them.</p>

          <p>That&apos;s when Sahla stopped being an app, and started becoming a platform.</p>
        </section>

        <Ornament />

        <section className={`${styles.section} ${styles.reveal}`} data-reveal>
          <h2>
            Every mosque deserves <em>its own</em> app.
          </h2>
          <p>
            That sentence is the entire reason Sahla exists. Not a page inside someone else&apos;s app. Not a logo in a directory. Their own app — their name on the App Store, their icon on the home screen, their identity in the pocket of every member of their community.
          </p>
          <p>
            Mosques have been underserved by technology for as long as technology has existed for mosques. The dominant model has been: pay a subscription, get a generic page on a shared platform, hope it does what you need. We thought that was backwards. The mosque is one of the most important institutions in a Muslim&apos;s life. The tech that serves it should reflect that — not flatten it into a template.
          </p>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} data-reveal>
          <h2>
            Built <em>with</em> mosques, not at them.
          </h2>
          <p>
            Everything we ship gets used at MAS Staten Island before it gets sold to anyone else. That rule is non-negotiable. If it doesn&apos;t work for a real community of three thousand five hundred people on a Friday afternoon, it doesn&apos;t go in the product.
          </p>
          <p>
            We design with mosque admins, not for them in the abstract. We sit with imams to understand iqamah rules. We talk to the volunteers who are actually adding programs at 11pm because they finally got off work. The features in Sahla aren&apos;t features we imagined someone might want — they&apos;re features people asked us for, by name, while we were standing in the masjid.
          </p>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} data-reveal>
          <h2>
            Made sustainable for the <em>mosque</em>, not just for us.
          </h2>
          <p>
            Most mosques can&apos;t justify a tech subscription out of their operating budget — and we knew that going in. So we built a business ads model directly into the platform. Local Muslim-owned businesses can promote their services inside the mosque app, and the ad revenue offsets the cost of the subscription. With as few as five active advertisers, the app pays for itself.
          </p>
          <p>That isn&apos;t a clever marketing line. It&apos;s the reason mosques actually say yes.</p>
        </section>

        <section className={`${styles.section} ${styles.reveal}`} data-reveal>
          <h2>
            What we&apos;re <em>building</em> toward.
          </h2>
          <p>
            We&apos;re not trying to be the biggest tech company in religious infrastructure. We&apos;re trying to build the right one — one that respects the mosque, serves the community, and earns the trust of every imam, board member, and volunteer who decides to bring us in.
          </p>
          <p>
            The first hundred mosques will look different from the next thousand, and we&apos;ll keep listening, keep iterating, keep making sure we don&apos;t drift. The standard is, and will always be: would this make the mosque stronger? If yes, we ship it. If not, it doesn&apos;t matter how good the demo looks.
          </p>
          <p>
            What started as a way to get my own notifications under control became an app for my masjid, then a platform for masjids everywhere. I think about that sheikh&apos;s talk often. Build with what you&apos;ve been given, for the people you&apos;ve been given to.
          </p>
        </section>
      </article>

      {/* ============== SIGNATURE FOOTER ============== */}
      <section className={`${styles.signoff} bg-dark-green`}>
        <div className={styles.signoffRule} />
        <p className={styles.signoffText}>
          <em>Sahla</em> means <em>&ldquo;easy&rdquo;</em> in Arabic.
          <br />
          That&apos;s the whole point.
        </p>

        <div className={`${styles.signatureBlock} ${styles.reveal} `} data-reveal>
          <span className={styles.signatureMark}>The Sahla Team</span>
          <div className={styles.signatureUnderline} />
          <div className={styles.signatureName}>New York · 2026</div>
        </div>
      </section>
    </div>
  );
}
