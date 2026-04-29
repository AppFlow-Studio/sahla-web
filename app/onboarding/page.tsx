"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useOrganizationList, useAuth } from "@clerk/nextjs";

const TARGET_PATH = "/mosque_profile";

export default function OnboardingPage() {
  const { isLoaded: authLoaded, isSignedIn, orgId } = useAuth();
  const { isLoaded: listLoaded, userMemberships, setActive } =
    useOrganizationList({ userMemberships: { infinite: true } });

  const [error, setError] = useState<string | null>(null);
  const setActiveTriggeredRef = useRef(false);
  const navigatedRef = useRef(false);

  // Navigate only once the reactive Clerk state confirms an active orgId.
  // This is the safest signal that the session cookie has been written —
  // navigating before this races against middleware reading the cookie and
  // bouncing us right back here.
  useEffect(() => {
    if (!orgId || navigatedRef.current) return;
    navigatedRef.current = true;
    window.location.href = TARGET_PATH;
  }, [orgId]);

  useEffect(() => {
    if (!authLoaded || !listLoaded || !setActive) return;
    if (orgId) return; // navigation effect will handle it
    if (!isSignedIn) return; // render sign-in CTA
    if (setActiveTriggeredRef.current) return;

    const memberships = userMemberships?.data ?? [];

    if (memberships.length === 0) {
      // Clerk may still be propagating the invitation acceptance; wait.
      return;
    }

    if (memberships.length > 1) {
      // Multi-org user — kick to the manual picker.
      navigatedRef.current = true;
      window.location.href = "/select-org";
      return;
    }

    setActiveTriggeredRef.current = true;
    setActive({ organization: memberships[0].organization.id }).catch((err) => {
      setActiveTriggeredRef.current = false;
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't switch you into your masjid's organization."
      );
    });
  }, [authLoaded, listLoaded, isSignedIn, orgId, userMemberships?.data, setActive]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-4xl font-semibold text-ink">
        Welcome to Sahla
      </h1>

      {!authLoaded ? (
        <p className="text-[14px] text-stone-500">Loading…</p>
      ) : error ? (
        <>
          <p className="max-w-md text-[14px] text-red-700">{error}</p>
          <Link
            href="/select-org"
            className="rounded-xl bg-ink px-5 py-2.5 text-[14px] font-semibold text-sand shadow-sm transition-all hover:shadow-md hover:brightness-110"
          >
            Pick your organization
          </Link>
        </>
      ) : !isSignedIn ? (
        <>
          <p className="max-w-md text-[14px] text-stone-600">
            Sign in to continue setting up your masjid.
          </p>
          <Link
            href="/login"
            className="rounded-xl bg-ink px-5 py-2.5 text-[14px] font-semibold text-sand shadow-sm transition-all hover:shadow-md hover:brightness-110"
          >
            Sign in
          </Link>
        </>
      ) : (
        <p className="text-[14px] text-stone-500">
          Setting up your account…
        </p>
      )}
    </div>
  );
}
