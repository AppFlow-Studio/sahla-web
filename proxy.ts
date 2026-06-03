// proxy.ts — Role-Based Routing via Clerk Organizations
//
// Routing logic:
//   Active org = Sahla HQ org → Admin HQ (overview, mosques, revenue, ...)
//   Active org = any mosque   → Masjid CRM (onboarding tasks at /[taskId])
//   No active org             → /select-org
//   Not signed in             → /login (or marketing page at /)

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID!;

const ADMIN_PATHS = [
  "/overview",
  "/mosques",
  "/pipeline",
  "/revenue",
  "/expenses",
  "/builds",
];

// CRM routes — eventually tier-gated to mosques on `core_crm`. During the UI
// build phase we let HQ admins preview these too so they can QA without
// switching orgs. Tighten in the backend pass.
const CRM_PATHS = [
  "/home",
  "/people",
  "/content",
  "/money",
  "/setup",
  "/settings",
];

function isCrmPath(pathname: string): boolean {
  return CRM_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

const isMarketingRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/contact(.*)",
  "/customers(.*)",
  "/global(.*)",
  "/waitlist(.*)",
  "/faq(.*)",
  "/pricing(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/why-sahla(.*)",
]);
const isLoginRoute = createRouteMatcher(["/login(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);
const isPublicApiRoute = createRouteMatcher(["/api/waitlist(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isSelectOrgRoute = createRouteMatcher(["/select-org"]);
const isOnboardingEntryRoute = createRouteMatcher(["/onboarding"]);

const LAUNCH_PATH = "/launch";
const MASJID_LANDING = "/dashboard";
const ADMIN_LANDING = "/overview";

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isWebhookRoute(req) || isLoginRoute(req) || isPublicApiRoute(req)) {
    return NextResponse.next();
  }

  const session = await auth();
  const url = req.nextUrl.clone();

  if (isMarketingRoute(req)) {
    // HQ admins go straight to their workspace.
    // Mosque admins (and signed-out visitors) are allowed to view marketing
    // pages — the page itself swaps the primary CTA based on auth + onboarding
    // state (e.g. "Finish Onboarding" for mosque admins mid-setup).
    if (!session.userId) return NextResponse.next();
    if (session.orgId === SAHLA_HQ_ORG_ID) {
      url.pathname = ADMIN_LANDING;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!session.userId) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // /launch is a virtual route — it always redirects, never renders.
  if (url.pathname === LAUNCH_PATH) {
    if (!session.orgId) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
    if (session.orgId === SAHLA_HQ_ORG_ID) {
      url.pathname = ADMIN_LANDING;
      return NextResponse.redirect(url);
    }
    // For mosque admins: route to /home if onboarding has shipped (ready/live),
    // otherwise drop them in the onboarding dashboard. Single DB hit so the
    // OrganizationSwitcher → /launch → final-destination chain is one hop.
    let landing: string = MASJID_LANDING;
    try {
      const supabase = createAdminSupabaseClient();
      const { data: mosque } = await supabase
        .from("mosques")
        .select("onboarding_status")
        .eq("clerk_org_id", session.orgId)
        .maybeSingle();
      if (
        mosque?.onboarding_status === "ready" ||
        mosque?.onboarding_status === "live"
      ) {
        landing = "/home";
      }
    } catch {
      // Fall back to /dashboard if the lookup fails; the masjid layout has
      // its own redirect-to-/home guard for already-shipped mosques.
    }
    url.pathname = landing;
    return NextResponse.redirect(url);
  }

  if (isSelectOrgRoute(req) || isOnboardingEntryRoute(req)) {
    return NextResponse.next();
  }

  if (!session.orgId) {
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  const isHQ = session.orgId === SAHLA_HQ_ORG_ID;

  if (isAdminPath(url.pathname)) {
    if (isHQ) return NextResponse.next();
    url.pathname = MASJID_LANDING;
    return NextResponse.redirect(url);
  }

  if (isApiRoute(req)) {
    return NextResponse.next();
  }

  // CRM routes — the (crm) server layout enforces tier + onboarding state
  // for non-HQ mosque admins. Proxy just passes through; defense-in-depth
  // is the layout + per-route requireCrmAccess() helper.
  if (isCrmPath(url.pathname)) {
    return NextResponse.next();
  }

  // The "no CRM access" upsell page must be reachable by mosque admins
  // whose tier doesn't grant CRM — i.e. the (crm) layout's redirect target.
  if (url.pathname === "/no-crm-access") {
    return NextResponse.next();
  }

  // Catch-all "if isHQ, send to /overview" was here. Removed because it
  // false-fires on masjid onboarding routes (/dashboard, /<taskId>) during
  // session-cookie races after `setActive(...)` calls or `router.refresh()`,
  // bouncing the admin to /overview mid-onboarding. The explicit isMarketing
  // branch above still routes HQ from `/` to `/overview`; the (masjid)
  // layout enforces orgId presence; (crm) layout enforces CRM access.

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
