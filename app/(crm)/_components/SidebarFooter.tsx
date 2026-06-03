"use client";

import Link from "next/link";
import { OrganizationSwitcher, useClerk, useUser } from "@clerk/nextjs";
import { LogOut, UserCircle, ArrowLeft } from "lucide-react";
import { useIsSahlaHQ } from "@/lib/auth/useIsSahlaHQ";

const SWITCHER_APPEARANCE = {
  variables: {
    colorBackground: "#0e2b22",
    colorText: "#fffbf2",
    colorTextSecondary: "rgba(255,251,242,0.55)",
    colorPrimary: "#fffbf2",
    colorTextOnPrimaryBackground: "#0A261E",
    colorInputBackground: "rgba(255,251,242,0.06)",
    colorInputText: "#fffbf2",
  },
  elements: {
    rootBox: { width: "100%" },
    organizationSwitcherTrigger: {
      width: "100%",
      padding: "8px 10px",
      borderRadius: "6px",
      color: "#fffbf2",
      backgroundColor: "transparent",
      transition: "background-color 150ms",
      "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
      "&:focus": { boxShadow: "none" },
    },
    organizationPreviewMainIdentifier: {
      fontSize: "12.5px",
      color: "#fffbf2",
    },
    organizationPreviewSecondaryIdentifier: {
      fontSize: "11px",
      color: "rgba(255,251,242,0.5)",
    },
  },
};

export default function SidebarFooter() {
  const { signOut, openUserProfile } = useClerk();
  const { isSignedIn, isLoaded, user } = useUser();
  const { isHQ } = useIsSahlaHQ();

  const displayName =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || "Account";

  return (
    <footer className="border-t border-white/[0.06] px-3 py-3">
      {isLoaded && isSignedIn ? (
        <div className="space-y-0.5">
          {isHQ && (
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/launch"
              afterSelectPersonalUrl="/select-org"
              appearance={SWITCHER_APPEARANCE}
            />
          )}
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
