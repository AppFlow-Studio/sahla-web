import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";

export const metadata: Metadata = {
  title: "Privacy Policy — Sahla",
  description:
    "How Sahla, Inc. collects, uses, and protects information on sahla.co. Applies to the marketing site only; each masjid app has its own separate policy.",
};

const SECTION_HEADING =
  "mb-3 font-[family-name:var(--font-hero)] text-[22px] text-dark-green";
const SUB_LABEL = "font-semibold text-dark-green";
const LINK = "text-[#1a6b42] underline underline-offset-4";
const UL = "list-disc space-y-2 pl-6 marker:text-dark-green/40";

export default function PrivacyPage() {
  return (
    <div className="relative">
      <Navbar />

      <section className="bg-[#fffbf2] pt-36 pb-10">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <h1 className="font-[family-name:var(--font-hero)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-dark-green">
            Privacy Policy
          </h1>
          <p className="mt-4 text-[14px] text-dark-green/40">
            Applies to sahla.co · Version 1.0 · Effective Date: August 15, 2026
          </p>
        </div>
      </section>

      <section className="bg-[#fffbf2] py-[60px]">
        <div className="mx-auto max-w-[720px] px-8">
          <div className="prose-green space-y-8 text-[15px] leading-[1.8] text-dark-green/65">
            {/* Preface */}
            <div>
              <h2 className={SECTION_HEADING}>What this Policy covers &mdash; and what it does not</h2>
              <p>
                This Privacy Policy describes how Sahla, Inc., a New York corporation
                (&ldquo;Sahla,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
                collects, uses, and protects information when you visit{" "}
                <a href="https://sahla.co" className={LINK}>sahla.co</a>{" "}
                and our related marketing pages, request a demonstration, join our waitlist,
                or contact us (together, the &ldquo;Site&rdquo;).
              </p>
              <p className="mt-4">
                <span className={SUB_LABEL}>This Policy does not cover the masjid apps.</span>{" "}
                Each masjid that uses Sahla has its own standalone application with its own
                privacy policy, published at that masjid&apos;s own address. In those
                applications, the masjid &mdash; not Sahla &mdash; is the organization that
                decides how community information is used, and Sahla acts as its service
                provider. If you are a member of a masjid community and you are looking for
                the policy that governs your account, your donations, or your program
                registrations, that policy is linked inside your masjid&apos;s app and is a
                separate document from this one.
              </p>
              <p className="mt-4">
                For the Site, Sahla is the controller of the information described below and
                is solely responsible for it.
              </p>
              <p className="mt-4">
                <span className={SUB_LABEL}>Our commitments.</span>{" "}
                We do not sell your personal information. We do not share it for
                cross-context behavioral advertising. We do not use it to train
                artificial-intelligence or machine-learning models. We do not use tracking
                technology on the Site for advertising purposes.
              </p>
            </div>

            {/* 1 */}
            <div>
              <h2 className={SECTION_HEADING}>1. Information We Collect</h2>
              <p>
                <span className={SUB_LABEL}>Information you give us.</span>
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Waitlist, demonstration, and contact requests.</span>{" "}
                When you ask to join the waitlist, request a demonstration, or contact us
                through the Site, we collect your name, your email address, the name of your
                masjid or organization, your role there, and, where the form requests it or
                you provide it, your telephone number. You may also include anything you
                choose to write in a message field.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Correspondence.</span>{" "}
                If you email or message us, we keep that correspondence and any information
                in it.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Applications and inquiries.</span>{" "}
                If you contact us about working with Sahla or partnering with us, we keep
                the information you send.
              </p>
              <p className="mt-4">
                <span className={SUB_LABEL}>Information collected automatically.</span>{" "}
                When you visit the Site, we and our service providers collect device and
                usage information, including your IP address, browser and device type,
                operating system, referring page, the pages you view, and the dates and
                times of your visits. We do not currently use third-party analytics on the
                Site. Advertising features, advertising identifiers, and cross-site
                advertising integrations are disabled in our configuration. We do not use
                the Site to build advertising profiles, and we do not permit third parties
                to collect information about you across other websites through the Site.
              </p>
              <p className="mt-4">
                <span className={SUB_LABEL}>Cookies and similar technologies.</span>{" "}
                The Site uses cookies and similar technologies that are strictly necessary
                for the Site to function and to keep it secure. We do not use advertising
                or cross-context behavioral advertising cookies. You can control cookies
                through your browser settings; disabling strictly necessary cookies may
                prevent parts of the Site from working.
              </p>
              <p className="mt-4">
                <span className={SUB_LABEL}>What we do not collect.</span>{" "}
                We do not collect payment card information through the Site. We do not
                knowingly collect information from children. The Site is intended for
                adults acting on behalf of an organization.
              </p>
            </div>

            {/* 2 */}
            <div>
              <h2 className={SECTION_HEADING}>2. How We Use Information</h2>
              <p>We use the information described above to:</p>
              <ul className={`${UL} mt-3`}>
                <li>respond to your waitlist entry, demonstration request, question, or message;</li>
                <li>
                  communicate with you about Sahla &mdash; including follow-up about a
                  request you made and, where you have opted in or where permitted by law
                  in the context of a business relationship, information about the product.
                  Every marketing email contains an unsubscribe link;
                </li>
                <li>
                  prepare for and carry out a subscription relationship, including
                  onboarding a masjid that decides to proceed;
                </li>
                <li>
                  operate, secure, maintain, and improve the Site, and diagnose problems;
                </li>
                <li>detect and prevent fraud, abuse, and security incidents; and</li>
                <li>comply with legal, tax, and accounting obligations.</li>
              </ul>
              <p className="mt-4">
                <span className={SUB_LABEL}>No artificial-intelligence training.</span>{" "}
                We do not use information collected through the Site to train, fine-tune,
                or evaluate artificial-intelligence or machine-learning models, and we do
                not permit our service providers to do so.
              </p>
            </div>

            {/* 3 */}
            <div>
              <h2 className={SECTION_HEADING}>3. How We Share Information</h2>
              <p>
                <span className={SUB_LABEL}>Service providers.</span>{" "}
                We share information with vendors that operate the Site and our business
                on our behalf &mdash; website and email hosting, analytics, customer
                relationship management, and scheduling. They are contractually restricted
                to using information only as necessary to provide services to us, are
                prohibited from selling it, and are prohibited from using it to train
                artificial-intelligence models.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Legal and corporate.</span>{" "}
                We may disclose information to comply with law or legal process, to protect
                the rights, property, or safety of Sahla or others, or in connection with a
                merger, acquisition, financing, or sale of assets, in which case
                information remains subject to this Policy or a successor policy no less
                protective.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>No sale, no ad-sharing.</span>{" "}
                We do not sell personal information, and we do not share it for
                cross-context behavioral advertising or targeted advertising.
              </p>
            </div>

            {/* 4 */}
            <div>
              <h2 className={SECTION_HEADING}>4. Retention</h2>
              <p>We keep information no longer than we need it:</p>
              <div className="mt-4 overflow-hidden rounded-lg border border-dark-green/10">
                <table className="w-full text-[14px]">
                  <thead className="bg-dark-green/5 text-left text-dark-green">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Retention</th>
                    </tr>
                  </thead>
                  <tbody className="text-dark-green/65">
                    <tr className="border-t border-dark-green/10">
                      <td className="px-4 py-3 align-top">Waitlist, demonstration, and inquiry records where no subscription follows</td>
                      <td className="px-4 py-3 align-top">Up to twenty-four (24) months from your last interaction with us, then deleted</td>
                    </tr>
                    <tr className="border-t border-dark-green/10">
                      <td className="px-4 py-3 align-top">Records of organizations that become customers</td>
                      <td className="px-4 py-3 align-top">For the term of the subscription and seven (7) years afterward, for tax, accounting, and legal purposes</td>
                    </tr>
                    <tr className="border-t border-dark-green/10">
                      <td className="px-4 py-3 align-top">Correspondence</td>
                      <td className="px-4 py-3 align-top">Up to twenty-four (24) months after the matter closes</td>
                    </tr>
                    <tr className="border-t border-dark-green/10">
                      <td className="px-4 py-3 align-top">Site analytics and log data</td>
                      <td className="px-4 py-3 align-top">Up to twenty-four (24) months</td>
                    </tr>
                    <tr className="border-t border-dark-green/10">
                      <td className="px-4 py-3 align-top">Backups</td>
                      <td className="px-4 py-3 align-top">Deleted information persists in encrypted backups for up to ninety (90) days and is not restored to active use</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                You may ask us to delete your information sooner at any time, as described
                in Section 6.
              </p>
            </div>

            {/* 5 */}
            <div>
              <h2 className={SECTION_HEADING}>5. Security</h2>
              <p>
                We maintain administrative, technical, and physical safeguards designed to
                protect information against unauthorized access, disclosure, alteration,
                and destruction, including encryption in transit and at rest, access
                controls, and least-privilege practices, consistent with the
                reasonable-safeguards requirement of the New York SHIELD Act. No method of
                transmission or storage is completely secure. In the event of a breach
                affecting your information, we will notify you and the appropriate
                regulators as required by applicable law.
              </p>
            </div>

            {/* 6 */}
            <div>
              <h2 className={SECTION_HEADING}>6. Your Choices and Rights</h2>
              <p>
                <span className={SUB_LABEL}>Marketing.</span>{" "}
                Every marketing email contains an unsubscribe link. You may also email{" "}
                <a href="mailto:info@sahla.co" className={LINK}>info@sahla.co</a> to be
                removed. We will still respond to requests you have made of us.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Access, correction, deletion, and portability.</span>{" "}
                Depending on the state in which you reside, you may have the right to know
                and access the personal information we hold about you, to receive it in a
                portable format, to correct it, to delete it, to opt out of its sale, of
                sharing or processing for targeted advertising, and of profiling producing
                legal or similarly significant effects &mdash; none of which we engage in
                &mdash; and not to be treated differently for exercising your rights.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>How to exercise them.</span>{" "}
                Email{" "}
                <a href="mailto:info@sahla.co" className={LINK}>info@sahla.co</a>. We will
                verify your request using the email address on file and any other
                information reasonably necessary, and we will respond within forty-five
                (45) days, subject to any extension permitted by law, of which we will
                notify you. Where permitted, you may use an authorized agent; we will
                require proof of authorization and verification of your identity.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Appeals.</span>{" "}
                If we decline a request, we will explain why. You may appeal by replying
                with &ldquo;Appeal&rdquo; in the subject line, and we will provide a
                written decision within the period required by the law of your state. If
                your appeal is denied, you may contact the Attorney General of your state;
                we will provide the contact information with our decision.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Opt-out preference signals.</span>{" "}
                We honor browser-based opt-out preference signals, including Global Privacy
                Control, on the Site. Because we do not sell personal information or share
                it for cross-context behavioral advertising, there is no sale or sharing to
                opt out of; we honor the signal as a request to limit non-essential
                analytics. We do not respond to browser &ldquo;Do Not Track&rdquo; signals.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>California.</span>{" "}
                In the preceding twelve months we have collected the following categories
                of personal information from you and from your use of the Site: identifiers
                (name, email address, telephone number, IP address); professional or
                employment-related information (your organization and role); internet or
                other electronic network activity (Site usage); and commercial information
                limited to your interest in our services. We collect these for the business
                purposes in Section 2 and disclose them for business purposes only to the
                recipients in Section 3. We have not sold or shared personal information,
                and we will not. We do not collect sensitive personal information through
                the Site. California &ldquo;Shine the Light&rdquo;: we do not disclose
                personal information to third parties for their own direct marketing
                purposes.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Nevada.</span>{" "}
                Nevada residents may submit a verified request to opt out of the sale of
                covered information to{" "}
                <a href="mailto:info@sahla.co" className={LINK}>info@sahla.co</a>. We do
                not sell covered information, and we will respond within sixty (60) days.
              </p>
              <p className="mt-3">
                <span className={SUB_LABEL}>Other states.</span>{" "}
                Residents of Colorado, Connecticut, Virginia, Texas, Oregon, Montana,
                Delaware, and other states with comprehensive privacy laws may exercise the
                rights above by the same method.
              </p>
            </div>

            {/* 7 */}
            <div>
              <h2 className={SECTION_HEADING}>7. Third-Party Links</h2>
              <p>
                The Site links to third-party destinations, including our customers&apos;
                apps in the Apple App Store and Google Play, and may link to masjid
                websites and social media. Those destinations are governed by their own
                privacy practices, which we encourage you to review.
              </p>
            </div>

            {/* 8 */}
            <div>
              <h2 className={SECTION_HEADING}>8. Changes to This Policy</h2>
              <p>
                We may amend this Policy. If we make material changes, we will post the
                updated Policy with a new Effective Date and Version at least ten (10) days
                before it takes effect.
              </p>
            </div>

            {/* 9 */}
            <div>
              <h2 className={SECTION_HEADING}>9. Contact Us</h2>
              <p>
                Sahla, Inc. · Attn: Privacy ·{" "}
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
