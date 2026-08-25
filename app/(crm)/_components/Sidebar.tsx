"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { CRM_NAV } from "../_lib/nav";
import { useMosque } from "../_lib/mock-mosque";
import { cn } from "@/lib/utils";
import ComingSoonBadge from "./ComingSoonBadge";
import SidebarFooter from "./SidebarFooter";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const mosque = useMosque();

  return (
    <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col self-start overflow-hidden border-r border-[var(--mosque-primary-fg,#fffbf2)]/[0.06] bg-[var(--mosque-primary,#0A261E)] text-[var(--mosque-primary-fg,#fffbf2)] md:flex">
      {/* Mosque header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          {mosque.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mosque.logoUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-[var(--mosque-primary-fg,#fffbf2)]/15"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-base text-[var(--mosque-accent-fg,#0A261E)] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15)]"
              style={{ background: "var(--mosque-accent, #B8922A)" }}
            >
              {mosque.logoInitials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] leading-tight text-[var(--mosque-primary-fg,#fffbf2)]">
              {mosque.appName || mosque.name}
            </p>
            <p className="text-[11px] leading-tight text-[var(--mosque-primary-fg,#fffbf2)]/40">
              {mosque.city}, {mosque.state}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {CRM_NAV.map((section) => {
          const Icon = section.icon;
          const isLeaf = !section.children;
          const isSectionActive = isLeaf
            ? pathname === section.href
            : section.children!.some(
                (c) =>
                  pathname === c.href || pathname.startsWith(c.href + "/")
              );

          if (isLeaf) {
            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  "group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                  isSectionActive
                    ? "bg-[var(--mosque-primary-fg,#fffbf2)]/[0.08] text-[var(--mosque-primary-fg,#fffbf2)]"
                    : "text-[var(--mosque-primary-fg,#fffbf2)]/60 hover:bg-[var(--mosque-primary-fg,#fffbf2)]/[0.04] hover:text-[var(--mosque-primary-fg,#fffbf2)]"
                )}
              >
                <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                {section.label}
              </Link>
            );
          }

          return (
            <SectionGroup
              key={section.id}
              section={section}
              currentPath={pathname}
              defaultOpen={isSectionActive}
            />
          );
        })}
      </nav>

      <SidebarFooter />
    </aside>
  );
}

function SectionGroup({
  section,
  currentPath,
  defaultOpen,
}: {
  section: (typeof CRM_NAV)[number];
  currentPath: string;
  defaultOpen: boolean;
}) {
  const Icon = section.icon;
  const children = section.children ?? [];

  // Always render expanded — short list, less click-friction. CRM is dummy-proof.
  // Keeping the chevron animation for visual polish; clicking the section header
  // navigates to the first child (most recent activity is what mosque admins want).
  const firstChildHref = children[0]?.href ?? section.href;

  return (
    <div className="mb-2">
      <Link
        href={firstChildHref}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
          defaultOpen
            ? "text-[var(--mosque-primary-fg,#fffbf2)]"
            : "text-[var(--mosque-primary-fg,#fffbf2)]/55 hover:text-[var(--mosque-primary-fg,#fffbf2)]"
        )}
      >
        <Icon size={16} strokeWidth={1.75} className="shrink-0" />
        <span className="flex-1">{section.label}</span>
        <motion.span
          aria-hidden
          animate={{ rotate: defaultOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="text-[var(--mosque-primary-fg,#fffbf2)]/35"
        >
          <ChevronRight size={12} strokeWidth={2} />
        </motion.span>
      </Link>

      <AnimatePresence initial={false}>
        {defaultOpen ? (
          <motion.ul
            key={`${section.id}-children`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="mt-0.5 ml-3 overflow-hidden border-l border-[var(--mosque-primary-fg,#fffbf2)]/[0.06] pl-3"
          >
            {children.map((child) => {
              const ChildIcon = child.icon;
              const isActive =
                currentPath === child.href ||
                currentPath.startsWith(child.href + "/");
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors",
                      isActive
                        ? "bg-[var(--mosque-primary-fg,#fffbf2)]/[0.08] text-[var(--mosque-primary-fg,#fffbf2)]"
                        : "text-[var(--mosque-primary-fg,#fffbf2)]/55 hover:bg-[var(--mosque-primary-fg,#fffbf2)]/[0.04] hover:text-[var(--mosque-primary-fg,#fffbf2)]"
                    )}
                  >
                    <ChildIcon
                      size={14}
                      strokeWidth={1.75}
                      className={cn(
                        "shrink-0",
                        isActive ? "" : "text-[var(--mosque-primary-fg,#fffbf2)]/40"
                      )}
                      style={
                        isActive
                          ? { color: "var(--mosque-accent, #B8922A)" }
                          : undefined
                      }
                    />
                    <span className="flex-1 truncate">{child.label}</span>
                    {child.comingSoon ? <ComingSoonBadge variant="ghost" /> : null}
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
