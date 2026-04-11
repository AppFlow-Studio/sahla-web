import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
import "./globals.css";

const inter = localFont({
  src: "../public/fonts/Inter-latin.woff2",
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
        className={`${inter.variable} ${dmSerif.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
