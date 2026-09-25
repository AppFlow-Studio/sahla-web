import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";
import FAQContent from "./FAQContent";
import { categories } from "./faqData";
import { BreadcrumbJsonLd, FAQPageJsonLd } from "../components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to the most common questions mosque boards ask about Sahla: ownership, pricing, Apple Developer fees, data privacy, and more.",
};

const allFaqs = categories.flatMap((category) => category.faqs);

export default function FAQPage() {
  return (
    <div className="relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://sahla.co/" },
          { name: "FAQ", url: "https://sahla.co/faq" },
        ]}
      />
      <FAQPageJsonLd faqs={allFaqs} />
      <Navbar />
      <FAQContent />
      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
