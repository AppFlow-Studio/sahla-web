import type { Metadata } from "next";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing — $300/mo, Mosque Keeps 100% of Donations",
  description:
    "One flat $300/month for a fully branded iOS and Android masjid app. Sahla takes 0% of donations, ad revenue, and program fees. Three local sponsors covers the cost.",
};

export default function PricingPage() {
  return <PricingContent />;
}
