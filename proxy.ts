// proxy.ts — Role-Based Routing via Clerk Organizations
//
// Routing logic:
//   Active org = Sahla HQ org → Admin HQ (overview, pipeline, mosques, ...)
//   Active org = any mosque   → Masjid CRM (onboarding tasks at /[taskId])
//   No active org             → /select-org
//   Not signed in             → /login (or marketing page at /)

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID!;

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

const LAUNCH_PATH = "/launch";
const MASJID_LANDING = "/dashboard";
const ADMIN_LANDING = "/overview";

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isWebhookRoute(req) || isLoginRoute(req)) {
    return NextResponse.next();
  }

  const session = await auth();
  const url = req.nextUrl.clone();

  if (isMarketingHome(req)) {
    return NextResponse.next();
  }

  if (!session.userId) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

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

  if (isSelectOrgRoute(req)) {
    return NextResponse.next();
  }

  if (!session.orgId) {
    url.pathname = "/select-org";
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

  if (isHQ) {
    url.pathname = ADMIN_LANDING;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
