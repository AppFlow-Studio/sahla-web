import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Amiri } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-source-sans",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.legalName} | Masjid in Bay Ridge, Brooklyn`,
  description: `${site.commonName} is a mosque in Bay Ridge, Brooklyn, serving the community since ${site.foundedYear}. Prayer times, Jummah, programs, and contact information.`,
  alternates: { canonical: site.url },
  openGraph: {
    title: `${site.legalName}`,
    description:
      "Mosque in Bay Ridge, Brooklyn. Prayer times, Jummah, programs, and contact.",
    url: site.url,
    siteName: site.commonName,
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSans.variable} ${amiri.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
