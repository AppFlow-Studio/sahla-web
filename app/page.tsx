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

const DEFAULT_CTA: Cta = { label: "Book a Demo", href: "/contact" };

/**
 * Resolves the secondary Hero CTA based on visitor state. Logged-out =
 * "Book a Demo" → /contact. Signed-in mosque admins mid-onboarding see
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
    .select("id, onboarding_status")
    .or(`clerk_org_id.eq.${session.orgId},id.eq.${session.orgId}`)
    .limit(1)
    .single();

  if (mosque?.onboarding_status === "in_progress") {
    return { label: "Finish Onboarding", href: "/onboarding" };
  }

  // Past onboarding — if their plan includes the CRM, drop them
  // straight into it. Otherwise fall back to the masjid dashboard.
  if (mosque?.id) {
    const { data: flags } = await supabase
      .from("mosque_feature_flags")
      .select("has_crm_access")
      .eq("mosque_id", mosque.id)
      .maybeSingle();
    if (flags?.has_crm_access) {
      return { label: "Open CRM", href: "/home" };
    }
  }

  return { label: "Open Dashboard", href: "/dashboard" };
}

export default async function Home() {
  const cta = await resolveCta();

  return (
    <div className="relative">
      <SoftwareApplicationJsonLd />
      <Navbar />
      <Hero ctaLabel={cta.label} ctaHref={cta.href} />
      <hr className="mx-auto max-w-[1200px] border-dark-green/[0.06]" />
      <AppShowcase />
      <hr className="mx-auto max-w-[1200px] border-dark-green/[0.06]" />
      <ProofBar />
      <hr className="mx-auto max-w-[1200px] border-dark-green/[0.06]" />
      <ThreeProblems />
      <hr className="mx-auto max-w-[1200px] border-dark-green/[0.06]" />
      <HowItWorks />
      <hr className="mx-auto max-w-[1200px] border-dark-green/[0.06]" />
      <Features />
      <hr className="mx-auto max-w-[1200px] border-dark-green/[0.06]" />
      <RevenueFlip />
      <hr className="mx-auto max-w-[1200px] border-dark-green/[0.06]" />
      <FAQTeaser />
      <CTASection />
      <BottomBar />
    </div>
  );
}
