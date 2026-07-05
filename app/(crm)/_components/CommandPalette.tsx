"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Plus,
  Send,
  CalendarPlus,
  UserPlus,
  Mic2,
  CreditCard,
  Palette,
  Clock,
  LifeBuoy,
  Sparkles,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";
import { CRM_NAV } from "../_lib/nav";
import { useMosque } from "../_lib/mock-mosque";

type Ctx = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const CommandPaletteContext = createContext<Ctx | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used inside CommandPaletteProvider");
  return ctx;
}

/**
 * One row in the palette. Every icon sits in an identical rounded tile so the
 * list reads as a uniform column regardless of each glyph's optical weight —
 * the tile, not the icon, defines the size. The active row tints ink and the
 * tile turns gold; a ↵ hint fades in when there's no dedicated shortcut.
 */
function PaletteItem({
  icon: Icon,
  section,
  label,
  shortcut,
  value,
  onSelect,
}: {
  icon: LucideIcon;
  section?: string;
  label: string;
  shortcut?: string;
  value: string;
  onSelect: () => void;
}) {
  return (
    <CommandItem value={value} onSelect={onSelect}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0A261E]/[0.05] text-[#0A261E]/55 transition-colors group-data-selected/command-item:bg-[var(--mosque-accent,#B8922A)]/15 group-data-selected/command-item:text-[var(--mosque-accent,#B8922A)]">
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1 truncate">
        {section ? <span className="text-[#0A261E]/45">{section} · </span> : null}
        <span className="text-[#0A261E]/85">{label}</span>
      </span>
      {shortcut ? (
        <CommandShortcut>{shortcut}</CommandShortcut>
      ) : (
        <CornerDownLeft
          size={13}
          className="ml-auto text-[#0A261E]/30 opacity-0 transition-opacity group-data-selected/command-item:opacity-100"
        />
      )}
    </CommandItem>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-[#0A261E]/10 bg-[var(--mosque-surface,#fffbf2)] px-1 font-sans text-[10px] font-semibold text-[#0A261E]/50">
      {children}
    </kbd>
  );
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const mosque = useMosque();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}

      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Quick search"
        description="Jump anywhere or do anything in your CRM"
      >
        <Command
          style={{ "--mosque-accent": mosque.accentColor } as React.CSSProperties}
        >
          <CommandInput placeholder="Search or jump to anything…" />
          <CommandList>
            <CommandEmpty>Nothing matches. Try a page name or action.</CommandEmpty>

            <CommandGroup heading="Navigate">
              {CRM_NAV.flatMap((sectionNode) => {
                if (!sectionNode.children) {
                  return [
                    <PaletteItem
                      key={sectionNode.href}
                      icon={sectionNode.icon}
                      label={sectionNode.label}
                      value={`${sectionNode.label} ${sectionNode.href}`}
                      onSelect={() => go(sectionNode.href)}
                    />,
                  ];
                }
                return sectionNode.children.map((child) => (
                  <PaletteItem
                    key={child.href}
                    icon={child.icon}
                    section={sectionNode.label}
                    label={child.label}
                    shortcut={child.comingSoon ? "Soon" : undefined}
                    value={`${sectionNode.label} ${child.label} ${child.href}`}
                    onSelect={() => go(child.href)}
                  />
                ));
              })}
            </CommandGroup>

            <CommandGroup heading="Quick actions">
              <PaletteItem
                icon={Mic2}
                label="Add a speaker"
                shortcut="S"
                value="add speaker"
                onSelect={() => go("/people/speakers")}
              />
              <PaletteItem
                icon={UserPlus}
                label="Invite a member"
                value="add member invite"
                onSelect={() => go("/people/members")}
              />
              <PaletteItem
                icon={CalendarPlus}
                label="Create a program"
                shortcut="P"
                value="create program"
                onSelect={() => go("/content/programs")}
              />
              <PaletteItem
                icon={Plus}
                label="Create an event"
                value="create event"
                onSelect={() => go("/content/events")}
              />
              <PaletteItem
                icon={Send}
                label="Send a notification"
                value="send notification"
                onSelect={() => go("/setup/notifications")}
              />
            </CommandGroup>

            <CommandGroup heading="Setup">
              <PaletteItem
                icon={Clock}
                label="Configure prayer times"
                value="prayer times"
                onSelect={() => go("/setup/prayer-times")}
              />
              <PaletteItem
                icon={Palette}
                label="Edit theme colors"
                value="theme colors"
                onSelect={() => go("/setup/theme")}
              />
              <PaletteItem
                icon={CreditCard}
                label="Manage subscription"
                value="subscription billing"
                onSelect={() => go("/settings/subscription")}
              />
              <PaletteItem
                icon={LifeBuoy}
                label="Message Sahla support"
                value="sahla support help"
                onSelect={() => go("/settings/sahla-support")}
              />
              <PaletteItem
                icon={Sparkles}
                label="Replay welcome tour"
                value="replay onboarding tour"
                onSelect={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem("sahla.crm.tour_seen.v1");
                    window.location.reload();
                  }
                }}
              />
            </CommandGroup>
          </CommandList>

          <div className="flex items-center gap-4 border-t border-[#0A261E]/8 px-4 py-2.5 text-[11px] text-[#0A261E]/45">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd>
              <span>Open</span>
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <Kbd>esc</Kbd>
              <span>Close</span>
            </span>
          </div>
        </Command>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
