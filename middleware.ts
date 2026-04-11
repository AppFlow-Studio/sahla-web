// ============================================================================
// Sahla Middleware — Role-Based Routing via Clerk Organizations
// ============================================================================
//
// Routing logic:
//   Active org = Sahla HQ org → Admin HQ (overview, pipeline, mosques, ...)
//   Active org = any mosque   → Masjid CRM (onboarding tasks at /[taskId])
//   No active org             → /select-org
//   Not signed in             → /login (or marketing page at /)
//
// IMPORTANT: Next.js strips route group names from URLs, so we cannot match
// admin routes via "/(admin)(.*)" — we have to enumerate the real URL paths.
// ============================================================================

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID!;

// Real URL paths owned by the admin section.
const ADMIN_PATHS = [
  "/overview",
  "/pipeline",
  "/mosques",
  "/revenue",
  "/expenses",
  "/builds",
];

const isMarketingHome = createRouteMatcher(["/"]);
const isLoginRoute = createRouteMatcher(["/login(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isSelectOrgRoute = createRouteMatcher(["/select-org"]);

// Virtual "post-login bouncer" path. Login + select-org point here, and the
// middleware decides where to send the user based on their active org.
// Never renders a page — middleware always redirects before render.
const LAUNCH_PATH = "/launch";

// First task in the onboarding flow — masjid users land here after login.
const MASJID_LANDING = "/mosque_profile";
const ADMIN_LANDING = "/overview";

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default clerkMiddleware(async (auth, req) => {
  // Always-public routes
  if (isWebhookRoute(req) || isLoginRoute(req)) {
    return NextResponse.next();
  }

  const session = await auth();
  const url = req.nextUrl.clone();

  // Marketing homepage is always public — both guests and signed-in users
  // can view it. Signed-in users get back to their app via /launch.
  if (isMarketingHome(req)) {
    return NextResponse.next();
  }

  // Everything below requires authentication
  if (!session.userId) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ── Post-login bouncer ──
  // /launch is a virtual route — it always redirects, never renders.
  if (url.pathname === LAUNCH_PATH) {
    if (!session.orgId) {
      url.pathname = "/select-org";
      return NextResponse.redirect(url);
    }
    url.pathname =
      session.orgId === SAHLA_HQ_ORG_ID ? ADMIN_LANDING : MASJID_LANDING;
    return NextResponse.redirect(url);
  }

  // Org selector page: allowed once signed in
  if (isSelectOrgRoute(req)) {
    return NextResponse.next();
  }

  // Signed in but no org chosen yet → org selector
  if (!session.orgId) {
    url.pathname = "/select-org";
    return NextResponse.redirect(url);
  }

  const isHQ = session.orgId === SAHLA_HQ_ORG_ID;

  // ── Admin section ──
  if (isAdminPath(url.pathname)) {
    if (isHQ) return NextResponse.next();
    // Mosque admin trying to peek at HQ pages → bounce to their onboarding
    url.pathname = MASJID_LANDING;
    return NextResponse.redirect(url);
  }

  // API routes: any authenticated org member is allowed; per-route handlers
  // are responsible for their own authorization checks.
  if (isApiRoute(req)) {
    return NextResponse.next();
  }

  // ── Everything else is a masjid /[taskId] route ──
  if (isHQ) {
    // HQ user wandering into masjid routes → back to admin
    url.pathname = ADMIN_LANDING;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run middleware on all routes except static files and _next
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
