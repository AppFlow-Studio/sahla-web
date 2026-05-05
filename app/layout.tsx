import type { Metadata, Viewport } from "next";
import { Inter, Geist, Fraunces, Newsreader, Mrs_Saint_Delafield } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";
import { OrganizationJsonLd } from "./components/JsonLd";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerif = localFont({
  src: "../public/fonts/DMSerifDisplay-latin.woff2",
  variable: "--font-display",
  weight: "400",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  display: "swap",
});

const signatureFont = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-signature",
  display: "swap",
});

const SITE_URL = "https://sahla.app";
const SITE_TITLE = "Sahla — Your Mosque Deserves Its Own App";
const SITE_DESCRIPTION =
  "Sahla builds fully branded iOS and Android apps for mosques. Your name in the App Store, your colors, your community. White-label mosque app builder with donations, prayer times, and sponsor revenue.";
const SOCIAL_DESCRIPTION =
  "Fully branded iOS and Android apps for mosques. Your name in the App Store, your colors, your community.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Sahla",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Sahla",
  authors: [{ name: "Sahla", url: SITE_URL }],
  creator: "Sahla",
  publisher: "Sahla",
  category: "technology",
  keywords: [
    "mosque app",
    "masjid app",
    "white label mosque app",
    "iOS mosque app",
    "Android mosque app",
    "branded masjid app",
    "prayer times app",
    "iqamah",
    "mosque donations",
    "Stripe Connect mosque",
    "mosque CRM",
    "Islamic app builder",
    "masjid technology",
    "Sahla",
  ],
  alternates: {
    canonical: "/",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Sahla",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SOCIAL_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sahla — Fully branded iOS and Android apps for mosques.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        alt: "Sahla — Fully branded iOS and Android apps for mosques.",
      },
    ],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/sahla-logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffbf2" },
    { media: "(prefers-color-scheme: dark)", color: "#0a261e" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#fffbf2",
          colorBackground: "#0e2b22",
          colorText: "#fffbf2",
          colorTextSecondary: "rgba(255,251,242,0.6)",
          colorInputBackground: "rgba(255,251,242,0.1)",
          colorInputText: "#fffbf2",
          colorNeutral: "#fffbf2",
          colorTextOnPrimaryBackground: "#0A261E",
        },
      }}
    >
      <html
        lang="en"
        className={cn(
          "h-full",
          "antialiased",
          inter.variable,
          dmSerif.variable,
          fraunces.variable,
          newsreader.variable,
          signatureFont.variable,
          "font-sans",
          geist.variable
        )}
      >
        <body className="min-h-full flex flex-col">
          <OrganizationJsonLd />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
