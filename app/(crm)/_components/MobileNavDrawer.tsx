"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { CRM_NAV } from "../_lib/nav";
import { useMosque } from "../_lib/mock-mosque";
import { cn } from "@/lib/utils";
import ComingSoonBadge from "./ComingSoonBadge";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MobileNavDrawer({ open, onOpenChange }: Props) {
  const pathname = usePathname();
  const mosque = useMosque();

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="left">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-[320px] flex-col bg-[#0A261E] text-[#fffbf2] outline-none">
          <Drawer.Title className="sr-only">Navigation</Drawer.Title>
          <Drawer.Description className="sr-only">
            Jump between sections of your mosque CRM
          </Drawer.Description>

          <div className="flex items-center justify-between px-5 pt-6 pb-5">
            <div className="flex items-center gap-3">
              {mosque.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={mosque.logoUrl}
                  alt=""
                  className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/15"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl font-display text-base text-[#0A261E]"
                  style={{ background: "var(--mosque-accent, #B8922A)" }}
                >
                  {mosque.logoInitials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] leading-tight text-[#E8D5B0]">
                  {mosque.name}
                </p>
                <p className="text-[11px] leading-tight text-[#fffbf2]/40">
                  {mosque.city}, {mosque.state}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#fffbf2]/60 transition-colors hover:bg-white/10 hover:text-[#fffbf2]"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-6">
            {CRM_NAV.map((section) => {
              const Icon = section.icon;
              if (!section.children) {
                const isActive = pathname === section.href;
                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-[#fffbf2]/65 hover:bg-white/5 hover:text-[#fffbf2]"
                    )}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {section.label}
                  </Link>
                );
              }
              return (
                <div key={section.id} className="mb-3">
                  <p className="mb-1 px-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[#fffbf2]/35">
                    {section.label}
                  </p>
                  {section.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isActive =
                      pathname === child.href ||
                      pathname.startsWith(child.href + "/");
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-[#fffbf2]/65 hover:bg-white/5 hover:text-[#fffbf2]"
                        )}
                      >
                        <ChildIcon
                          size={14}
                          strokeWidth={1.75}
                          className={isActive ? "" : "text-[#fffbf2]/45"}
                          style={
                            isActive
                              ? { color: "var(--mosque-accent, #B8922A)" }
                              : undefined
                          }
                        />
                        <span className="flex-1">{child.label}</span>
                        {child.comingSoon ? <ComingSoonBadge variant="ghost" /> : null}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
