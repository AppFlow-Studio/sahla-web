import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";

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
  title: "Sahla",
  description: "Community Center App Creation Studio",
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
          colorPrimary: "#4a8c65",
          colorBackground: "#1a3a2a",
          colorText: "#f0ebe3",
          colorInputBackground: "#040a07",
          colorInputText: "#f0ebe3",
        },
      }}
    >
      <html
        lang="en"
        className={cn("h-full", "antialiased", inter.variable, dmSerif.variable, "font-sans", geist.variable)}
      >
        <body className="min-h-full flex flex-col">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
