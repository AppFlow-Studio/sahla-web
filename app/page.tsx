import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import HomeClient from "./HomeClient";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

type Cta = { label: string; href: string };

const DEFAULT_CTA: Cta = { label: "Get Started", href: "/login" };

async function resolveCta(): Promise<Cta> {
  const session = await auth();

  if (!session.userId) return DEFAULT_CTA;

  // HQ admins shouldn't reach this page (proxy redirects them) — guard anyway.
  if (session.orgId && session.orgId === SAHLA_HQ_ORG_ID) {
    return { label: "Open Admin", href: "/overview" };
  }

  // Signed in but no active org — push them through the smart router so they
  // can pick / auto-select their masjid org and resume.
  if (!session.orgId) {
    return { label: "Continue Setup", href: "/onboarding" };
  }

  // Mosque admin — look up onboarding status to decide between resume vs open.
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
  return <HomeClient cta={cta} />;
}
