// X and LinkedIn don't allow dots in handles/slugs, so "sahlamasjid" is used
// there instead of the literal "sahla.masjid" handle used everywhere else.
// TODO: verify every one of these profiles actually exists before shipping —
// these were not confirmed against the live accounts.
const SAHLA_SAME_AS = [
  "https://instagram.com/sahla.masjid",
  "https://linkedin.com/company/sahlamasjid",
  "https://x.com/sahlamasjid",
  "https://youtube.com/@sahla.masjid",
  "https://tiktok.com/@sahla.masjid",
  "https://facebook.com/sahla.masjid",
  "https://threads.net/@sahla.masjid",
];

type JsonLdType =
  | "Organization"
  | "WebSite"
  | "SoftwareApplication"
  | "BreadcrumbList"
  | "FAQPage"
  | "Product";

/**
 * Generic schema.org structured-data emitter. Prefer this (or one of the
 * typed wrappers below) over hand-writing `<script type="application/ld+json">`
 * in a page — with ~85 more pages coming, copy-pasted JSON is how a field
 * gets typo'd or a page silently drifts from what Google expects.
 */
export function JsonLd({
  type,
  data,
}: {
  type: JsonLdType;
  data: Record<string, unknown>;
}) {
  const json = { "@context": "https://schema.org", "@type": type, ...data };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/** Root layout only — one per site. */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      type="Organization"
      data={{
        name: "Sahla",
        url: "https://sahla.co",
        logo: "https://sahla.co/sahla-logo.png",
        description:
          "Sahla builds fully branded iOS and Android apps for mosques. White-label mosque app builder with donations, prayer times, and sponsor revenue.",
        contactPoint: {
          "@type": "ContactPoint",
          email: "info@sahla.co",
          contactType: "sales",
        },
        sameAs: SAHLA_SAME_AS,
      }}
    />
  );
}

/** Root layout only — describes the site itself, not any one page. */
export function WebSiteJsonLd() {
  return (
    <JsonLd
      type="WebSite"
      data={{
        name: "Sahla",
        url: "https://sahla.co",
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      type="SoftwareApplication"
      data={{
        name: "Sahla",
        applicationCategory: "BusinessApplication",
        operatingSystem: "iOS, Android",
        description:
          "White-label mosque app builder. Fully branded iOS and Android apps for mosques with prayer times, donations, push notifications, and community programs.",
        offers: {
          "@type": "Offer",
          price: "300",
          priceCurrency: "USD",
          priceValidUntil: "2027-12-31",
        },
      }}
    />
  );
}

/** Every page except the homepage. */
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return (
    <JsonLd
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

/** /faq, and any other page with an FAQ section (e.g. the homepage teaser). */
export function FAQPageJsonLd({
  faqs,
}: {
  faqs: Array<{ q: string; a: string }>;
}) {
  return (
    <JsonLd
      type="FAQPage"
      data={{
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      }}
    />
  );
}

/** /pricing — one per plan, so Google can show each price as its own Offer. */
export function ProductJsonLd({
  name,
  description,
  offers,
}: {
  name: string;
  description: string;
  offers: Array<{
    price: number;
    priceCurrency: string;
    url: string;
  }>;
}) {
  return (
    <JsonLd
      type="Product"
      data={{
        name,
        description,
        brand: { "@type": "Brand", name: "Sahla" },
        offers: offers.map((offer) => ({
          "@type": "Offer",
          price: offer.price,
          priceCurrency: offer.priceCurrency,
          url: offer.url,
          availability: "https://schema.org/InStock",
          priceValidUntil: "2027-12-31",
        })),
      }}
    />
  );
}
