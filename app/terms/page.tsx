import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import DemoContent from "../demo/DemoContent";
import BottomBar from "../components/BottomBar";

export const metadata: Metadata = {
  title: "Terms of Service — Sahla",
  description: "Sahla's terms of service. The agreement between Sahla and mosques using our platform.",
};

export default function TermsPage() {
  return (
    <div className="relative">
      <Navbar />
      <section className="bg-dark-green pt-36 pb-10">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(36px,4.5vw,56px)] leading-[1.06] text-sand">
            Terms of Service
          </h1>
          <p className="mt-4 text-[14px] text-sand/40">Last updated: April 23, 2026</p>
        </div>
      </section>

      <section className="bg-[#fffbf2] py-[60px]">
        <div className="mx-auto max-w-[720px] px-8">
          <div className="prose-green space-y-8 text-[15px] leading-[1.8] text-dark-green/65">
            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">1. Agreement to Terms</h2>
              <p>By accessing or using Sahla&apos;s services, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a mosque, community center, or organization, you represent that you have the authority to bind that entity.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">2. Description of Service</h2>
              <p>Sahla provides a platform for mosques and community centers to build, launch, and manage branded mobile applications on iOS and Android. This includes app development, hosting, maintenance, and ongoing support as described in your subscription plan.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">3. Subscription & Payment</h2>
              <p>Sahla subscriptions are billed monthly. You may cancel at any time with 30 days written notice. There are no setup fees, cancellation penalties, or long-term contracts. Payment is processed through Stripe. Pricing may change with 60 days advance notice.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">4. App Ownership</h2>
              <p>Your mosque retains ownership of its app, branding, content, and data. The app is published under your mosque&apos;s Apple Developer and Google Play accounts. Sahla provides the platform and technology; your mosque owns the product built on it.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">5. Data Ownership & Privacy</h2>
              <p>Your mosque owns all congregant data collected through the app. Sahla processes this data solely to provide the service and in accordance with our Privacy Policy. We do not sell, share, or use your data for purposes beyond service delivery.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">6. Content Responsibility</h2>
              <p>Your mosque is responsible for all content published through its app, including announcements, programs, events, and media. Sahla does not censor, moderate, or interfere with mosque content unless required by law or App Store guidelines.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">7. Cancellation & Data Export</h2>
              <p>Upon cancellation, Sahla will provide a complete data export within 30 days. All mosque data will be permanently deleted within 60 days of cancellation unless otherwise requested. Your app listings remain under your developer accounts.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">8. Service Availability</h2>
              <p>Sahla aims for 99.9% uptime. We will notify you in advance of any planned maintenance. In the event of extended downtime, affected subscription days will be credited to your account.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">9. Limitation of Liability</h2>
              <p>Sahla&apos;s liability is limited to the amount you paid for the service in the 12 months preceding the claim. Sahla is not liable for indirect, incidental, or consequential damages arising from use of the service.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">10. Changes to Terms</h2>
              <p>We may update these terms with 30 days advance notice. Continued use of the service after changes take effect constitutes acceptance. If you disagree with changes, you may cancel your subscription.</p>
            </div>

            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-[22px] text-dark-green">11. Contact</h2>
              <p>Questions about these terms? Contact us at <a href="mailto:legal@sahla.app" className="text-[#1a6b42] underline underline-offset-4">legal@sahla.app</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <DemoContent />
      <BottomBar />
    </div>
  );
}
