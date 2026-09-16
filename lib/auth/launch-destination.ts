import { auth } from "@clerk/nextjs/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ALL_TASKS } from "@/app/(masjid)/components/onboarding-tasks";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

export type LaunchKind =
  /** Not signed in. Back to the door. */
  | "signed-out"
  /** Sahla staff, active org is HQ. */
  | "hq"
  /** Signed in with no org yet — first run. */
  | "setup"
  /** Mosque mid-onboarding, checklist unfinished. */
  | "resume"
  /** Shipped mosque on a plan that includes the CRM. */
  | "crm"
  /** Shipped mosque on Core, whose home screen is the receipt. */
  | "receipt";

export type LaunchDestination = {
  href: string;
  kind: LaunchKind;
  /** Name of the place they're going. */
  title: string;
  /** One line on what is waiting there. */
  detail: string;
  /** Checklist position, when the destination is onboarding. */
  steps?: { done: number; total: number };
};

/**
 * Where this session belongs, and what to call it.
 *
 * Same branching the proxy used to do invisibly at `/launch`. It lives here
 * now so the hand-off screen can name the destination before sending anyone
 * there — the routing decision and the sentence describing it can't drift.
 */
export async function resolveLaunchDestination(): Promise<LaunchDestination> {
  const session = await auth();

  if (!session.userId) {
    return {
      href: "/login",
      kind: "signed-out",
      title: "Sign in",
      detail: "Your session has expired.",
    };
  }

  if (!session.orgId) {
    return {
      href: "/onboarding",
      kind: "setup",
      title: "Set up your masjid",
      detail: "Let's get your app started.",
    };
  }

  if (SAHLA_HQ_ORG_ID && session.orgId === SAHLA_HQ_ORG_ID) {
    return {
      href: "/overview",
      kind: "hq",
      title: "Sahla HQ",
      detail: "Pipeline, revenue, and every mosque on the platform.",
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: mosque } = await supabase
      .from("mosques")
      .select("id, name, onboarding_status, onboarding_progress")
      .eq("clerk_org_id", session.orgId)
      .maybeSingle();

    const name = mosque?.name?.trim() || "your masjid";
    const shipped =
      mosque?.onboarding_status === "ready" ||
      mosque?.onboarding_status === "live";

    if (mosque?.id && shipped) {
      const { data: flags } = await supabase
        .from("mosque_feature_flags")
        .select("has_crm_access")
        .eq("mosque_id", mosque.id)
        .maybeSingle();

      return flags?.has_crm_access
        ? {
            href: "/home",
            kind: "crm",
            title: name,
            detail: "Your community, content, and donations.",
          }
        : {
            href: "/complete",
            kind: "receipt",
            title: name,
            detail: "Your app is live. Here's where everything stands.",
          };
    }

    const progress = (mosque?.onboarding_progress ?? {}) as Record<
      string,
      unknown
    >;
    const done = ALL_TASKS.filter((t) => progress[t.id] === true).length;

    return {
      href: "/dashboard",
      kind: "resume",
      title: name,
      detail:
        done === 0
          ? "Your setup checklist is ready."
          : "Picking up where you left off.",
      steps: { done, total: ALL_TASKS.length },
    };
  } catch {
    // The checklist is the safe landing: the masjid layout re-guards it, and
    // a shipped mosque gets bounced from there to /complete anyway.
    return {
      href: "/dashboard",
      kind: "resume",
      title: "your masjid",
      detail: "Opening your dashboard.",
    };
  }
}
