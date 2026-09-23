import type { Metadata } from "next";
import { site } from "@/config/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: `Privacy Policy | ${site.commonName}`,
  alternates: { canonical: `${site.url}/privacy` },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="wrap legal-page">
        <span className="label">Privacy</span>
        <h1>Privacy Policy</h1>
        {/* PLACEHOLDER */}
        <p data-placeholder="true">
          Privacy policy for {site.legalName} Full text coming.
        </p>
      </main>
      <Footer />
    </>
  );
}
