"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Menu, Search, ChevronRight } from "lucide-react";
import { breadcrumbFor } from "../_lib/nav";
import { useMosque } from "../_lib/mock-mosque";
import { useCommandPalette } from "./CommandPalette";
import NotificationInbox from "./NotificationInbox";
import { crmProfileAppearance } from "../_lib/clerkAppearance";

export default function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const mosque = useMosque();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const { open } = useCommandPalette();

  const trail = breadcrumbFor(pathname);
  const initials = (user?.firstName?.[0] || user?.username?.[0] || "•").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#0A261E]/8 bg-[var(--mosque-surface,#fffbf2)]/95 px-4 backdrop-blur-md md:h-16 md:px-6">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0A261E]/65 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E] md:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 text-[13px] md:flex">
        <Link
          href="/home"
          className="line-clamp-1 font-display text-[15px] text-[#0A261E] hover:opacity-75"
        >
          {mosque.name}
        </Link>
        {trail.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 text-[#0A261E]/45">
            <ChevronRight size={12} strokeWidth={2} />
            {i === trail.length - 1 ? (
              <span className="text-[#0A261E]/85">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-[#0A261E]">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="flex-1 md:hidden" />

      {/* Cmd-K trigger — floating pill */}
      <button
        type="button"
        onClick={open}
        aria-label="Search or jump to"
        className="group hidden h-10 items-center gap-2.5 rounded-full border border-[#0A261E]/[0.07] bg-white pl-4 pr-3 text-[13px] text-[#0A261E]/55 shadow-[0_2px_8px_-2px_rgba(10,38,30,0.10),0_1px_2px_rgba(10,38,30,0.05)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-px hover:border-[#0A261E]/10 hover:shadow-[0_8px_20px_-6px_rgba(10,38,30,0.18),0_2px_5px_rgba(10,38,30,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mosque-accent,#B8922A)]/40 sm:flex md:min-w-[300px]"
      >
        <Search
          size={15}
          strokeWidth={2}
          className="shrink-0 text-[#0A261E]/40 transition-colors group-hover:text-[var(--mosque-accent,#B8922A)]"
        />
        <span className="flex-1 text-left transition-colors group-hover:text-[#0A261E]/80">
          Search or jump to…
        </span>
        <kbd className="hidden items-center gap-0.5 rounded-full border border-[#0A261E]/[0.08] bg-[var(--mosque-surface,#fffbf2)] px-2 py-0.5 font-sans text-[10px] font-semibold text-[#0A261E]/50 transition-colors group-hover:border-[#0A261E]/15 md:inline-flex">
          ⌘K
        </kbd>
      </button>

      {/* Mobile cmd-k icon — floating pill */}
      <button
        type="button"
        onClick={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0A261E]/[0.07] bg-white text-[#0A261E]/60 shadow-[0_2px_8px_-2px_rgba(10,38,30,0.10),0_1px_2px_rgba(10,38,30,0.05)] transition-colors hover:text-[var(--mosque-accent,#B8922A)] sm:hidden"
        aria-label="Search"
      >
        <Search size={16} />
      </button>

      {/* Notifications */}
      <NotificationInbox />

      {/* Avatar */}
      <button
        type="button"
        onClick={() => openUserProfile({ appearance: crmProfileAppearance })}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mosque-primary,#0A261E)] text-[12px] font-semibold text-[var(--mosque-primary-fg,#fffbf2)] ring-2 ring-white transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mosque-accent,#B8922A)]"
        title={user?.fullName ?? "Account"}
        aria-label="Open profile"
      >
        {initials}
      </button>
    </header>
  );
}
