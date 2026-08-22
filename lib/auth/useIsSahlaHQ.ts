"use client";

import { useUser } from "@clerk/nextjs";

const HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

/**
 * True when the signed-in user holds membership in the Sahla HQ Clerk org —
 * i.e. they're on the Sahla team and may legitimately need to switch between
 * the HQ org and any mosque org they're impersonating for QA/onboarding.
 *
 * Mosque admins belong to a single mosque org and shouldn't see the
 * organization switcher at all; gate any "switch orgs" UI on `isHQ`.
 *
 * `ready` flips to true once Clerk has loaded the current user, so the
 * consumer can avoid flashing the switcher in/out during hydration.
 *
 * Uses `useUser().user.organizationMemberships` (fully-cached array) rather
 * than `useOrganizationList` — the latter is paginated and can return an
 * incomplete list on first render for users in 3+ orgs, causing MosquePicker
 * to silently not render even for real HQ users.
 */
export function useIsSahlaHQ(): { ready: boolean; isHQ: boolean } {
  const { isLoaded, user } = useUser();
  if (!isLoaded) return { ready: false, isHQ: false };
  const memberships = user?.organizationMemberships ?? [];
  const isHQ =
    !!HQ_ORG_ID &&
    memberships.some((m) => m.organization.id === HQ_ORG_ID);
  return { ready: true, isHQ };
}
