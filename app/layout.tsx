import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Sahla — Your Mosque Deserves Its Own App",
    template: "%s | Sahla",
  },
  description:
    "Sahla builds fully branded iOS and Android apps for mosques. Your name in the App Store, your colors, your community. White-label mosque app builder with donations, prayer times, and sponsor revenue.",
  metadataBase: new URL("https://sahla.app"),
  openGraph: {
    type: "website",
    siteName: "Sahla",
    title: "Sahla — Your Mosque Deserves Its Own App",
    description:
      "Fully branded iOS and Android apps for mosques. Your name in the App Store, your colors, your community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sahla — Your Mosque Deserves Its Own App",
    description:
      "Fully branded iOS and Android apps for mosques. Your name in the App Store, your colors, your community.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        className={cn("h-full", "antialiased", inter.variable, dmSerif.variable, "font-sans", geist.variable)}
      >
        <body className="min-h-full flex flex-col">
          <OrganizationJsonLd />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
