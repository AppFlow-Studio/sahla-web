// proxy.ts — Role-Based Routing via Clerk Organizations
//
// Routing logic:
//   Active org = Sahla HQ org → Admin HQ (overview, mosques, revenue, ...)
//   Active org = any mosque   → Masjid CRM (onboarding tasks at /[taskId])
//   No active org             → /select-org
//   Not signed in             → /login (or marketing page at /)

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { ALL_TASKS } from "@/app/(masjid)/components/onboarding-tasks";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID!;

// Every onboarding task slug renders at a bare top-level URL (e.g.
// /mosque_profile) via the (masjid)/[taskId] catch-all. Anything else at a
// single segment is not a real page.
const TASK_IDS = new Set(ALL_TASKS.map((t) => t.id));

const ADMIN_PATHS = [
  "/overview",
  "/mosques",
  "/pipeline",
  "/revenue",
  "/expenses",
  "/builds",
  "/promo-codes",
];

// CRM routes — eventually tier-gated to mosques on `core_crm`. During the UI
// build phase we let HQ admins preview these too so they can QA without
// switching orgs. Tighten in the backend pass.
const CRM_PATHS = [
  "/home",
  "/insights",
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
  "/resources(.*)",
  "/glossary(.*)",
  "/vs(.*)",
  "/features(.*)",
]);
const isLoginRoute = createRouteMatcher(["/login(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);
// /api/pricing exposes only public plan prices (read from Stripe) and is
// consumed by the signed-out marketing /pricing page, so it must skip auth.
const isPublicApiRoute = createRouteMatcher(["/api/waitlist(.*)", "/api/pricing(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isSelectOrgRoute = createRouteMatcher(["/select-org"]);
const isOnboardingEntryRoute = createRouteMatcher(["/onboarding"]);

// Routes that exist but aren't covered by the matchers above — used only to
// tell a real (if unauthenticated) page apart from a genuinely nonexistent
// URL. Keep in sync with Step 3 of SAHLA-WEB-01: every page that needs a
// login must be reachable through one of these checks, or it will 404
// instead of prompting sign-in.
const isOtherKnownRoute = createRouteMatcher([
  "/dashboard",
  "/complete",
  "/no-crm-access",
  "/onboarding(.*)",
  "/billing(.*)",
]);

const LAUNCH_PATH = "/launch";
const MASJID_LANDING = "/dashboard";
const ADMIN_LANDING = "/overview";

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isKnownAppPath(req: NextRequest, pathname: string): boolean {
  const segment = pathname.replace(/^\/+|\/+$/g, "");
  const isSingleSegmentTaskRoute = segment.length > 0 && !segment.includes("/") && TASK_IDS.has(segment);

  return (
    isMarketingRoute(req) ||
    isLoginRoute(req) ||
    isWebhookRoute(req) ||
    isPublicApiRoute(req) ||
    isApiRoute(req) ||
    isSelectOrgRoute(req) ||
    isOtherKnownRoute(req) ||
    isAdminPath(pathname) ||
    isCrmPath(pathname) ||
    pathname === LAUNCH_PATH ||
    isSingleSegmentTaskRoute
  );
}

// isbr.sahla.co is a static site served from public/isbr/ via rewrites in
// next.config.ts. None of the Sahla routing below applies to it — in
// particular, the HQ-admin redirect from "/" would fire for Sahla staff whose
// Clerk session cookie is shared across *.sahla.co.
const ISBR_HOST_RE = /^isbr\.(sahla\.co|localhost)(:\d+)?$/;

export const proxy = clerkMiddleware(async (auth, req) => {
  if (ISBR_HOST_RE.test(req.headers.get("host") ?? "")) {
    return NextResponse.next();
  }

  if (isWebhookRoute(req) || isLoginRoute(req) || isPublicApiRoute(req)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();

  if (!isKnownAppPath(req, url.pathname)) {
    // Not a real route. Previously every unmatched URL fell through to the
    // "not signed in -> /login" branch below, so 404s (typos, bots probing
    // /wp-admin, etc.) redirected to the login page instead of 404ing.
    // Rewriting into a two-segment path that nothing can match forces Next's
    // own not-found rendering — going straight to NextResponse.next() would
    // instead let this single-segment path fall into the masjid layout's
    // /[taskId] catch-all, which redirects before the page gets a chance to
    // 404 an unrecognized task id.
    url.pathname = `/__not-found__${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  const session = await auth();

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

  // /launch renders the hand-off screen, which resolves the destination
  // itself (lib/auth/launch-destination.ts) so it can name the place before
  // sending anyone there. Auth is already enforced above.
  if (url.pathname === LAUNCH_PATH) {
    return NextResponse.next();
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|txt|xml|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
