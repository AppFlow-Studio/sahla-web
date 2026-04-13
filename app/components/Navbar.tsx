"use client";

import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();

  return (
    <nav className="absolute top-0 right-0 left-0 z-50 flex items-center justify-between px-8 py-5">
      <div className="font-[family-name:var(--font-display)] text-xl tracking-wide text-dark-green">
        Sahla
      </div>

      {/* Reserve space until Clerk loads to avoid layout flicker */}
      <div className="flex items-center gap-2">
        {!isLoaded ? null : isSignedIn ? (
          <>
            <Link
              href="/launch"
              className="rounded-full bg-dark-green px-5 py-2 text-sm font-medium tracking-wide text-white shadow-sm transition-all hover:bg-dark-green/90 hover:shadow-md"
            >
              Open App
            </Link>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="rounded-full border border-dark-green/15 bg-surface px-5 py-2 text-sm font-medium tracking-wide text-dark-green shadow-sm transition-all hover:border-dark-green/25 hover:shadow-md"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-dark-green/15 bg-surface px-5 py-2 text-sm font-medium tracking-wide text-dark-green shadow-sm transition-all hover:border-dark-green/25 hover:shadow-md"
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}
