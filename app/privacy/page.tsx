import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";

export const metadata: Metadata = {
  title: "Privacy Policy — Sahla",
  description: "Sahla's privacy policy. How we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="relative">
      <Navbar />
      <section className="bg-dark-green pt-36 pb-10">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-sand">
            Privacy Policy
          </h1>
          <p className="mt-4 text-[14px] text-sand/40">Last updated: April 23, 2026</p>
        </div>
      </section>

      <section className="bg-[#fffbf2] py-[60px]">
        <div className="mx-auto max-w-[720px] px-8">
          <div className="prose-green space-y-8 text-[15px] leading-[1.8] text-dark-green/65">
            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, onboard your mosque, or contact us. This includes your name, email address, mosque name, and mosque configuration data. We also collect information about how you use our platform through standard analytics.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">2. How We Use Your Information</h2>
              <p>We use your information to provide and improve our services, communicate with you about your account, and send you updates about Sahla. We never sell your data to third parties. We never use your congregant data for advertising, analytics, or any purpose other than providing the service you signed up for.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">3. Congregant Data</h2>
              <p>Your mosque&apos;s congregant data — including names, email addresses, donation history, and app usage — belongs to your mosque. Sahla holds this data on your behalf and provides tools to export it at any time. We do not access, analyze, or share congregant data except as needed to provide the service. Only your authorized mosque admins can view this data.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">4. Donation Data</h2>
              <p>Donations are processed through Stripe Connect. Your mosque owns its Stripe Connect account. Sahla never has access to donor payment information. Stripe&apos;s own privacy policy governs payment data processing.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">5. Data Security</h2>
              <p>We use industry-standard security measures to protect your data, including encryption at rest and in transit, regular security audits, and access controls. Our infrastructure is hosted on trusted cloud providers with SOC 2 compliance.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">6. Data Retention & Deletion</h2>
              <p>If you cancel your Sahla subscription, we provide a full data export within 30 days and permanently delete your data within 60 days unless you request extended retention. You can request data deletion at any time by contacting us.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">7. GDPR & CCPA Compliance</h2>
              <p>We comply with GDPR, CCPA, and other applicable privacy regulations. You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@sahla.app.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">8. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify you of significant changes by email or through the platform. Your continued use of Sahla after changes constitutes acceptance of the updated policy.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">9. Contact Us</h2>
              <p>If you have questions about this privacy policy or our data practices, contact us at <a href="mailto:privacy@sahla.app" className="text-[#1a6b42] underline underline-offset-4">privacy@sahla.app</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
