import type { Metadata } from "next";
import { site } from "@/config/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: `Terms of Use | ${site.commonName}`,
  alternates: { canonical: `${site.url}/terms` },
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="wrap legal-page">
        <span className="label">Terms</span>
        <h1>Terms of Use</h1>
        {/* PLACEHOLDER */}
        <p data-placeholder="true">
          Terms of use for {site.legalName} Full text coming.
        </p>
      </main>
      <Footer />
    </>
  );
}
