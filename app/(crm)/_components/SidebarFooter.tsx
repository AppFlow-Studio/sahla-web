"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, UserCircle, ArrowLeft } from "lucide-react";

export default function SidebarFooter() {
  const { signOut, openUserProfile } = useClerk();
  const { isSignedIn, isLoaded, user } = useUser();

  const displayName =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "Account";

  return (
    <footer className="border-t border-white/[0.06] px-3 py-3">
      {isLoaded && isSignedIn ? (
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] text-[#fffbf2]/60 transition-colors hover:bg-white/[0.04] hover:text-[#fffbf2]"
          >
            <UserCircle size={15} strokeWidth={1.5} />
            <span className="line-clamp-1 flex-1 text-left">{displayName}</span>
          </button>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] text-[#fffbf2]/60 transition-colors hover:bg-white/[0.04] hover:text-[#fffbf2]"
          >
            <LogOut size={15} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      ) : (
        <Link
          href="/"
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] text-[#fffbf2]/60 transition-colors hover:bg-white/[0.04] hover:text-[#fffbf2]"
        >
          <ArrowLeft size={14} />
          Back to Sahla
        </Link>
      )}
    </footer>
  );
}
