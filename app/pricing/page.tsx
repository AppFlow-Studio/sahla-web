import type { Metadata } from "next";
import PricingContent from "./PricingContent";
import { BreadcrumbJsonLd, ProductJsonLd } from "../components/JsonLd";
import { getPlanPricing } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing — $300/mo, Mosque Keeps 100% of Donations",
  description:
    "One flat $300/month for a fully branded iOS and Android masjid app. Sahla takes 0% of donations, ad revenue, and program fees. Three local sponsors covers the cost.",
};

export default async function PricingPage() {
  const pricing = await getPlanPricing();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://sahla.co/" },
          { name: "Pricing", url: "https://sahla.co/pricing" },
        ]}
      />
      <ProductJsonLd
        name="Sahla Standard"
        description="Fully branded iOS and Android mosque app with prayer times, donations, push notifications, and community programs."
        offers={[
          {
            price: pricing.core.amount,
            priceCurrency: pricing.core.currency.toUpperCase(),
            url: "https://sahla.co/pricing",
          },
        ]}
      />
      <ProductJsonLd
        name="Sahla + CRM"
        description="Everything in Sahla Standard, plus the admin CRM for member engagement analytics, advanced reporting, and priority support."
        offers={[
          {
            price: pricing.core_crm.amount,
            priceCurrency: pricing.core_crm.currency.toUpperCase(),
            url: "https://sahla.co/pricing",
          },
        ]}
      />
      <PricingContent />
    </>
  );
}
