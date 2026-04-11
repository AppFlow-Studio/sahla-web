// proxy.ts — Role-Based Routing via Clerk Organizations
//
// Routing logic:
//   Active org = Sahla HQ org → route to (admin)/ → Admin HQ dashboard
//   Active org = any mosque   → route to (masjid)/ → Onboarding/management
//   No active org             → redirect to org selection

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID!;

const isAdminRoute = createRouteMatcher(["/(admin)(.*)"]);
const isMasjidRoute = createRouteMatcher(["/(masjid)(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/login(.*)", "/api/webhooks(.*)"]);

export const proxy = clerkMiddleware(async (auth, req) => {
  // Allow public routes (login page, webhook endpoints)
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Require authentication for everything else
  const session = await auth();
  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const activeOrgId = session.orgId;
  const url = req.nextUrl.clone();

  // ── No active org: redirect to org selection ──
  // This happens on first login before the user selects which org to work in.
  // Clerk's <OrganizationSwitcher> component handles the selection UI.
  if (!activeOrgId) {
    // If they're already on a page with org selector, let them through
    if (url.pathname === "/select-org") {
      return NextResponse.next();
    }
    url.pathname = "/select-org";
    return NextResponse.redirect(url);
  }

  // ── Sahla HQ org: route to admin dashboard ──
  if (activeOrgId === SAHLA_HQ_ORG_ID) {
    // If trying to access masjid routes while in HQ org → redirect to admin
    if (isMasjidRoute(req)) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Any other org (mosque): route to mosque CRM ──
  // If trying to access admin routes while in a mosque org → redirect to masjid
  if (isAdminRoute(req)) {
    url.pathname = "/";
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