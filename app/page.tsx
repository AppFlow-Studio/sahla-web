import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SoftwareApplicationJsonLd } from "./components/JsonLd";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProofBar from "./components/ProofBar";
import ThreeProblems from "./components/ThreeProblems";
import HowItWorks from "./components/HowItWorks";
import AppShowcase from "./components/AppShowcase";
import Features from "./components/Features";
import RevenueFlip from "./components/RevenueFlip";
import BuiltForMosques from "./components/BuiltForMosques";
import FAQTeaser from "./components/FAQTeaser";
import CTASection from "./components/CTASection";
import BottomBar from "./components/BottomBar";

export const metadata: Metadata = {
  title: "Sahla — Your Mosque Deserves Its Own App",
  description:
    "Sahla builds fully branded iOS and Android apps for mosques. Your name in the App Store, your colors, your community. White-label mosque app builder with built-in donations, prayer times, and sponsor revenue.",
};

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

type Cta = { label: string; href: string };

const DEFAULT_CTA: Cta = { label: "Get Started", href: "/login" };

/**
 * Resolves the secondary Hero CTA based on visitor state. Logged-out =
 * "Get Started" → /login. Signed-in mosque admins mid-onboarding see
 * "Finish Onboarding"; finished mosques see "Open App"; unaffiliated users
 * see "Continue Setup". HQ admins shouldn't reach this page (proxy redirects
 * them), but we guard anyway.
 */
async function resolveCta(): Promise<Cta> {
  const session = await auth();

  if (!session.userId) return DEFAULT_CTA;

  if (session.orgId && session.orgId === SAHLA_HQ_ORG_ID) {
    return { label: "Open Admin", href: "/overview" };
  }

  if (!session.orgId) {
    return { label: "Continue Setup", href: "/onboarding" };
  }

  const supabase = createAdminSupabaseClient();
  const { data: mosque } = await supabase
    .from("mosques")
    .select("onboarding_status")
    .or(`clerk_org_id.eq.${session.orgId},id.eq.${session.orgId}`)
    .limit(1)
    .single();

  if (mosque?.onboarding_status === "in_progress") {
    return { label: "Finish Onboarding", href: "/onboarding" };
  }

  return { label: "Open App", href: "/launch" };
}

export default async function Home() {
  const cta = await resolveCta();

  return (
    <div className="relative">
      <SoftwareApplicationJsonLd />
      <Navbar />
      <Hero ctaLabel={cta.label} ctaHref={cta.href} />
      <AppShowcase />
      <ProofBar />
      <ThreeProblems />
      <HowItWorks />
      <Features />
      <RevenueFlip />
      <BuiltForMosques />
      <FAQTeaser />
      <CTASection />
      <BottomBar />
    </div>
  );
}
