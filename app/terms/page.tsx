import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";

export const metadata: Metadata = {
  title: "Terms of Use — Sahla",
  description:
    "Terms governing your use of sahla.co. Does not govern the masjid apps or any subscription — those are separate documents.",
};

const SECTION_HEADING =
  "mb-3 font-[family-name:var(--font-hero)] text-[22px] text-dark-green";
const SUB_LABEL = "font-semibold text-dark-green";
const LINK = "text-[#1a6b42] underline underline-offset-4";
const UL = "list-disc space-y-2 pl-6 marker:text-dark-green/40";
// Legal convention: disclaimer and limitation-of-liability sections are set
// in ALL CAPS so a reader can't miss them. Kept as literal caps in prose;
// tone-down the font-weight so they don't overwhelm the page visually.
const LEGAL_CAPS = "text-dark-green/75";

export default function TermsPage() {
  return (
    <div className="relative">
      <Navbar />

      <section className="bg-[#fffbf2] pt-36 pb-10">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <h1 className="font-[family-name:var(--font-hero)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-dark-green">
            Terms of Use
          </h1>
          <p className="mt-4 text-[14px] text-dark-green/40">
            Applies to sahla.co · Version 1.0 · Effective Date: August 15, 2026
          </p>
        </div>
      </section>

      <section className="bg-[#fffbf2] py-[60px]">
        <div className="mx-auto max-w-[720px] px-8">
          <div className="prose-green space-y-8 text-[15px] leading-[1.8] text-dark-green/65">
            {/* 1 */}
            <div>
              <h2 className={SECTION_HEADING}>1. These Terms</h2>
              <p>
                These Terms of Use govern your use of{" "}
                <a href="https://sahla.co" className={LINK}>sahla.co</a>{" "}
                and our related marketing pages (the &ldquo;Site&rdquo;), operated by
                Sahla, Inc., a New York corporation (&ldquo;Sahla,&rdquo; &ldquo;we,&rdquo;
                &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By using the Site, you accept
                these Terms and our{" "}
                <a href="/privacy" className={LINK}>Website Privacy Policy</a>. If you do
                not agree, do not use the Site.
              </p>
              <p className="mt-4">
                <span className={SUB_LABEL}>These Terms do not govern the masjid apps.</span>{" "}
                Each masjid using Sahla has its own application with its own terms of use
                and privacy policy, which are separate documents linked inside that
                application. Nothing in these Terms amends them.
              </p>
              <p className="mt-4">
                <span className={SUB_LABEL}>These Terms do not govern a subscription.</span>{" "}
                A masjid&apos;s subscription to Sahla is governed solely by the Masjid
                Subscription Agreement executed between Sahla and that masjid.
              </p>
            </div>

            {/* 2 */}
            <div>
              <h2 className={SECTION_HEADING}>2. Nothing on the Site Is an Offer</h2>
              <p>
                Information on the Site &mdash; including descriptions of the product,
                features, availability, plans, and prices &mdash; is provided for general
                information and is subject to change at any time without notice. Nothing
                on the Site constitutes an offer capable of acceptance, a commitment to
                provide any service, or a term of any agreement. Prices displayed on the
                Site are current list prices and do not fix the price of any subscription;
                the fee for a subscription is the fee stated in the Order Form of the
                executed Masjid Subscription Agreement, and that Agreement, together with
                its exhibits, is the entire agreement between Sahla and a masjid regarding
                the services. In the event of any inconsistency between the Site and an
                executed Masjid Subscription Agreement, the Agreement governs, and no
                statement on the Site may be relied upon as a representation, warranty,
                or term of that Agreement.
              </p>
              <p className="mt-4">
                Joining a waitlist, requesting a demonstration, or corresponding with us
                does not create any contract, reserve any position, or entitle you to
                service.
              </p>
            </div>

            {/* 3 */}
            <div>
              <h2 className={SECTION_HEADING}>3. Forward-Looking Statements</h2>
              <p>
                Descriptions of features that are planned, in development, or described as
                coming are statements of present intention only. Sahla may change, delay,
                or abandon any of them at its discretion, and no purchasing decision
                should be made in reliance on them.
              </p>
            </div>

            {/* 4 */}
            <div>
              <h2 className={SECTION_HEADING}>4. Submissions and Feedback</h2>
              <p>
                Do not send us confidential information through the Site. Information you
                submit through a form or by email is handled as described in the{" "}
                <a href="/privacy" className={LINK}>Website Privacy Policy</a>, but the
                Site is not a secure channel for confidential material.
              </p>
              <p className="mt-4">
                If you send us ideas, suggestions, or feedback about Sahla, you grant us a
                perpetual, irrevocable, worldwide, royalty-free right to use them without
                restriction, attribution, or compensation. We may already be considering
                similar ideas, and nothing obliges us to keep your suggestion confidential
                or to compensate you for it.
              </p>
            </div>

            {/* 5 */}
            <div>
              <h2 className={SECTION_HEADING}>5. Intellectual Property</h2>
              <p>
                The Site and its contents &mdash; including text, design, graphics,
                layout, software, and the Sahla name, logo, and marks &mdash; are owned
                by Sahla and its licensors and are protected by intellectual property
                laws. Customer names, logos, and content appearing on the Site belong to
                their respective owners and are used with permission. You may view and
                print pages of the Site for your own internal, non-commercial use. No
                other license is granted, expressly or by implication.
              </p>
            </div>

            {/* 6 */}
            <div>
              <h2 className={SECTION_HEADING}>6. Acceptable Use</h2>
              <p>You will not, and will not attempt to:</p>
              <ul className={`${UL} mt-3`}>
                <li>use the Site for any unlawful purpose;</li>
                <li>
                  scrape, crawl, harvest, or otherwise extract data from the Site, or
                  access it by automated means;
                </li>
                <li>
                  copy, reproduce, republish, or distribute any part of the Site except as
                  Section 5 permits;
                </li>
                <li>
                  interfere with or disrupt the Site, probe or circumvent its security, or
                  introduce malicious code;
                </li>
                <li>
                  submit false information, impersonate any person or organization, or
                  submit forms in bad faith;
                </li>
                <li>
                  use the Site or information obtained from it to develop or market a
                  competing product, or to solicit our customers; or
                </li>
                <li>
                  use contact information obtained from the Site to send unsolicited
                  commercial messages.
                </li>
              </ul>
              <p className="mt-4">
                We may restrict or block access to the Site for any violation.
              </p>
            </div>

            {/* 7 */}
            <div>
              <h2 className={SECTION_HEADING}>7. Third-Party Links</h2>
              <p>
                The Site links to third-party destinations, including the Apple App Store,
                Google Play, our customers&apos; websites, and social media. We do not
                control them, do not endorse them by linking, and are not responsible for
                their content or practices.
              </p>
            </div>

            {/* 8 */}
            <div>
              <h2 className={SECTION_HEADING}>8. Disclaimer</h2>
              <p className={LEGAL_CAPS}>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE SITE AND ALL
                INFORMATION ON IT ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
                AVAILABLE,&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS, IMPLIED, OR
                STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                TITLE, NON-INFRINGEMENT, AND ANY WARRANTY OF ACCURACY, COMPLETENESS, OR
                CURRENCY. WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED,
                ERROR-FREE, OR SECURE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF
                CERTAIN WARRANTIES, SO SOME OF THE ABOVE MAY NOT APPLY TO YOU.
              </p>
            </div>

            {/* 9 */}
            <div>
              <h2 className={SECTION_HEADING}>9. Limitation of Liability</h2>
              <p className={LEGAL_CAPS}>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, SAHLA WILL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
                OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST DATA, OR LOSS OF GOODWILL,
                ARISING OUT OF OR RELATING TO THE SITE, AND SAHLA&apos;S AGGREGATE
                LIABILITY ARISING OUT OF OR RELATING TO THE SITE WILL NOT EXCEED ONE
                HUNDRED U.S. DOLLARS (US$100).
              </p>
              <p className={`mt-4 ${LEGAL_CAPS}`}>
                NOTHING IN THESE TERMS LIMITS OR EXCLUDES LIABILITY FOR SAHLA&apos;S OWN
                GROSS NEGLIGENCE, WILLFUL MISCONDUCT, OR FRAUD, OR ANY OTHER LIABILITY
                THAT CANNOT BE LIMITED OR EXCLUDED UNDER APPLICABLE LAW. THIS SECTION
                DOES NOT LIMIT SAHLA&apos;S LIABILITY UNDER AN EXECUTED MASJID
                SUBSCRIPTION AGREEMENT, WHICH IS GOVERNED BY THAT AGREEMENT.
              </p>
            </div>

            {/* 10 */}
            <div>
              <h2 className={SECTION_HEADING}>10. Governing Law and Venue</h2>
              <p>
                These Terms are governed by the laws of the State of New York, without
                regard to conflict-of-laws principles, and without depriving you of the
                protection of any mandatory consumer-protection law of the state in which
                you reside. You and Sahla consent to the exclusive jurisdiction and venue
                of the state and federal courts located in Richmond County, New York.
              </p>
            </div>

            {/* 11 */}
            <div>
              <h2 className={SECTION_HEADING}>11. Changes to These Terms</h2>
              <p>
                We may amend these Terms at any time by posting an updated version with a
                new Effective Date and Version. Your continued use of the Site after that
                date constitutes acceptance.
              </p>
            </div>

            {/* 12 */}
            <div>
              <h2 className={SECTION_HEADING}>12. General</h2>
              <p>
                These Terms, together with the{" "}
                <a href="/privacy" className={LINK}>Website Privacy Policy</a>, are the
                entire agreement between you and Sahla regarding the Site. If any
                provision is held unenforceable, it will be enforced to the maximum extent
                permissible and the remainder will remain in effect. Our failure to
                enforce a provision is not a waiver. You may not assign these Terms; we
                may assign them in connection with a merger, acquisition, financing, or
                sale of assets. Nothing in these Terms creates any agency, partnership,
                joint venture, or employment relationship.
              </p>
            </div>

            {/* 13 */}
            <div>
              <h2 className={SECTION_HEADING}>13. Contact</h2>
              <p>
                Sahla, Inc. · Attn: Legal ·{" "}
                <a href="mailto:info@sahla.co" className={LINK}>info@sahla.co</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
