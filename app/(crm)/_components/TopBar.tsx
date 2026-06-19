"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Menu, Search, ChevronRight } from "lucide-react";
import { breadcrumbFor } from "../_lib/nav";
import { useMosque } from "../_lib/mock-mosque";
import { useCommandPalette } from "./CommandPalette";
import NotificationInbox from "./NotificationInbox";

export default function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const mosque = useMosque();
  const { user } = useUser();
  const { open } = useCommandPalette();

  const trail = breadcrumbFor(pathname);
  const initials = (user?.firstName?.[0] || user?.username?.[0] || "•").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#0A261E]/8 bg-[#fffbf2]/95 px-4 backdrop-blur-md md:h-16 md:px-6">
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

      {/* Cmd-K trigger */}
      <button
        type="button"
        onClick={open}
        className="group hidden h-9 items-center gap-2 rounded-lg border border-[#0A261E]/10 bg-white/70 px-3 text-[12.5px] text-[#0A261E]/55 transition-colors hover:border-[#0A261E]/20 hover:text-[#0A261E] sm:flex md:min-w-[240px]"
      >
        <Search size={14} strokeWidth={1.75} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-[#0A261E]/12 bg-[#fffbf2] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[#0A261E]/55 md:inline-flex">
          ⌘K
        </kbd>
      </button>

      {/* Mobile cmd-k icon */}
      <button
        type="button"
        onClick={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#0A261E]/65 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E] sm:hidden"
        aria-label="Search"
      >
        <Search size={16} />
      </button>

      {/* Notifications */}
      <NotificationInbox />

      {/* Avatar */}
      <div
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A261E] text-[12px] font-semibold text-[#fffbf2] ring-2 ring-white"
        title={user?.fullName ?? "Account"}
      >
        {initials}
      </div>
    </header>
  );
}
