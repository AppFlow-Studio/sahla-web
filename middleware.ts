// src/middleware.ts
// ============================================================================
// CRM Middleware — Role-Based Routing via Clerk Organizations
// ============================================================================
//
// This middleware runs on every request to crm.sahla.app and determines
// whether the user should see Admin HQ (Sahla team) or the Mosque CRM
// (mosque admin onboarding).
//
// Routing logic:
//   Active org = Sahla HQ org → route to (admin)/ → Admin HQ dashboard
//   Active org = any mosque   → route to (masjid)/ → Onboarding/management
//   No active org             → redirect to org selection
//
// ============================================================================

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ── Sahla HQ Organization ID ──
// This is the Clerk Organization created for Temur's internal team.
// It's the ONLY org that routes to the admin dashboard.
// All other orgs are mosque orgs and route to the mosque CRM.
const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID!;

// Route matchers
const isAdminRoute = createRouteMatcher(["/(admin)(.*)"]);
const isMasjidRoute = createRouteMatcher(["/(masjid)(.*)"]);
const isPublicRoute = createRouteMatcher(["/","/login(.*)", "/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, req) => {
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


// ============================================================================
// COMPANION: Layout Route Groups
// ============================================================================
//
// src/app/
//   (admin)/          ← Sahla HQ dashboard (dark theme)
//     layout.tsx      ← Admin shell with sidebar: Overview, Mosques, Pipeline, Revenue, Pulse, Settings
//     page.tsx        ← D1: Overview dashboard
//
//   (masjid)/         ← Mosque CRM (light theme, brand-colored)
//     layout.tsx      ← Onboarding shell with task sidebar
//     page.tsx        ← Onboarding dashboard
//     [taskId]/       ← Individual task panels
//
//   select-org/       ← Organization selection page (for users in multiple orgs)
//     page.tsx        ← <OrganizationSwitcher /> component
//
//   login/            ← Public login page
//     page.tsx        ← <SignIn /> component
//
// ============================================================================
//
// ENVIRONMENT VARIABLES NEEDED:
//
//   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
//   CLERK_SECRET_KEY=sk_live_xxx
//   NEXT_PUBLIC_SAHLA_ORG_ID=org_sahla_xxx       ← The Sahla HQ org ID
//   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
//   SUPABASE_SERVICE_ROLE_KEY=eyJxxx
//
// ============================================================================