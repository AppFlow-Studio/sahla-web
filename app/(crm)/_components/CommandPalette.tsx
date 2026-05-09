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
  CommandSeparator,
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
} from "lucide-react";
import { CRM_NAV } from "../_lib/nav";

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

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

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

  function go(href: string) {
    close();
    router.push(href);
  }

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}

      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Quick search"
        description="Jump anywhere or do anything in your CRM"
      >
        <Command>
          <CommandInput placeholder="Type a destination or action…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>

            <CommandGroup heading="Navigate">
              {CRM_NAV.flatMap((section) => {
                if (!section.children) {
                  const Icon = section.icon;
                  return [
                    <CommandItem
                      key={section.href}
                      value={`${section.label} ${section.href}`}
                      onSelect={() => go(section.href)}
                    >
                      <Icon size={14} />
                      <span>{section.label}</span>
                    </CommandItem>,
                  ];
                }
                return section.children.map((child) => {
                  const Icon = child.icon;
                  return (
                    <CommandItem
                      key={child.href}
                      value={`${section.label} ${child.label} ${child.href}`}
                      onSelect={() => go(child.href)}
                    >
                      <Icon size={14} />
                      <span>{section.label}</span>
                      <span className="text-[#0A261E]/40"> · </span>
                      <span>{child.label}</span>
                      {child.comingSoon ? (
                        <CommandShortcut>Soon</CommandShortcut>
                      ) : null}
                    </CommandItem>
                  );
                });
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Quick actions">
              <CommandItem value="add speaker" onSelect={() => go("/people/speakers")}>
                <Mic2 size={14} />
                Add a speaker
                <CommandShortcut>S</CommandShortcut>
              </CommandItem>
              <CommandItem value="add member invite" onSelect={() => go("/people/members")}>
                <UserPlus size={14} />
                Invite a member
              </CommandItem>
              <CommandItem value="create program" onSelect={() => go("/content/programs")}>
                <CalendarPlus size={14} />
                Create a program
                <CommandShortcut>P</CommandShortcut>
              </CommandItem>
              <CommandItem value="create event" onSelect={() => go("/content/events")}>
                <Plus size={14} />
                Create an event
              </CommandItem>
              <CommandItem
                value="send notification"
                onSelect={() => go("/setup/notifications")}
              >
                <Send size={14} />
                Send a notification
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Setup">
              <CommandItem value="prayer times" onSelect={() => go("/setup/prayer-times")}>
                <Clock size={14} />
                Configure prayer times
              </CommandItem>
              <CommandItem value="theme colors" onSelect={() => go("/setup/theme")}>
                <Palette size={14} />
                Edit theme colors
              </CommandItem>
              <CommandItem value="subscription billing" onSelect={() => go("/settings/subscription")}>
                <CreditCard size={14} />
                Manage subscription
              </CommandItem>
              <CommandItem value="sahla support help" onSelect={() => go("/settings/sahla-support")}>
                <LifeBuoy size={14} />
                Message Sahla support
              </CommandItem>
              <CommandItem
                value="replay onboarding tour"
                onSelect={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem("sahla.crm.tour_seen.v1");
                    window.location.reload();
                  }
                }}
              >
                <Sparkles size={14} />
                Replay welcome tour
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
