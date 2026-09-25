import { site } from "@/config/site";
import { getPrayerTimes } from "@/lib/prayerTimes";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import PrayerTimes from "@/components/PrayerTimes";
import Programs from "@/components/Programs";
import Leadership from "@/components/Leadership";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default async function Home() {
  const prayerData = await getPrayerTimes();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Mosque",
    name: site.commonName,
    legalName: site.legalName,
    url: site.url,
    logo: `${site.url}/logo.png`,
    image: `${site.url}/og.jpg`,
    telephone: site.phone,
    email: site.email,
    foundingDate: site.foundedDate,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.streetAddress,
      addressLocality: site.city,
      addressRegion: site.state,
      postalCode: site.postalCode,
      addressCountry: "US",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <Hero
          hijriDate={prayerData.hijriDate}
          gregorianReadable={prayerData.gregorianReadable}
        />
        <About />
        <PrayerTimes data={prayerData} />
        <Programs />
        <Leadership />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
