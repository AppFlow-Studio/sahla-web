"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useActivity } from "../_hooks/useActivity";
import { useMosque } from "../_lib/mock-mosque";
import { relativeShort } from "../_lib/format";
import { activityMeta, TONE_BADGE } from "../_lib/activityMeta";

const STORAGE_PREFIX = "sahla.crm.inbox.last_read.";
const INBOX_LIMIT = 20;

function tsOf(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Persisted "last read" mark for this mosque, or null on the server / if unset. */
function readStoredMark(mosqueId: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_PREFIX + mosqueId);
  return raw ? Number(raw) : null;
}

/**
 * TopBar notification inbox. Surfaces the same unified activity feed the Home
 * dashboard uses (new members, donations, RSVPs, sent notifications, new
 * programs/events, settings changes) so a mosque admin sees what's happened
 * without leaving the page they're on.
 *
 * Read-state is tracked per-mosque in localStorage (a "last read" timestamp) —
 * no schema needed since it's a per-device convenience, not shared state. The
 * unread badge counts events newer than that mark; opening the panel clears it.
 */
export default function NotificationInbox() {
  const mosque = useMosque();
  const events = useActivity(INBOX_LIMIT);

  const [open, setOpen] = useState(false);
  // `lastReadAt` drives the badge; `highlightBoundary` is frozen on open so the
  // rows that *were* unread stay highlighted for the duration of the session.
  // Lazy-read from storage: on the server this is null (no badge), and the badge
  // is gated by `events` — empty until react-query resolves — so the first paint
  // matches SSR regardless and there's no hydration mismatch. `null` means
  // "caught up" so returning visitors don't see their whole history as unread.
  const [lastReadAt, setLastReadAt] = useState<number | null>(() =>
    readStoredMark(mosque.id)
  );
  const [highlightBoundary, setHighlightBoundary] = useState<number | null>(null);

  const unreadCount = useMemo(() => {
    if (lastReadAt == null) return 0;
    return events.filter((e) => tsOf(e.occurredAt) > lastReadAt).length;
  }, [events, lastReadAt]);

  function persistMark(ts: number) {
    setLastReadAt(ts);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_PREFIX + mosque.id, String(ts));
    }
  }

  function markAllRead() {
    const now = Date.now();
    persistMark(now);
    setHighlightBoundary(now);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Freeze the highlight boundary at the pre-open mark, then clear the badge.
      setHighlightBoundary(lastReadAt ?? Date.now());
      persistMark(Date.now());
    }
  }

  const sessionUnread = useMemo(() => {
    if (highlightBoundary == null) return 0;
    return events.filter((e) => tsOf(e.occurredAt) > highlightBoundary).length;
  }, [events, highlightBoundary]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#0A261E]/65 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
      >
        <Bell size={16} strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B8922A] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-[#fffbf2]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-[360px] gap-0 p-0"
      >
        <div className="flex items-center justify-between border-b border-[#0A261E]/8 px-4 py-3">
          <h2 className="text-[14px] font-semibold text-[#0A261E]">
            Notifications
          </h2>
          {sessionUnread > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0A261E]/55 transition-colors hover:text-[#0A261E]"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          ) : null}
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6f1e4] text-[#B8922A]">
              <Inbox size={17} />
            </div>
            <p className="text-[13px] font-medium text-[#0A261E]">
              You&apos;re all caught up
            </p>
            <p className="max-w-[220px] text-[12px] text-[#0A261E]/50">
              New members, donations, and sent notifications will show up here.
            </p>
          </div>
        ) : (
          <ul className="max-h-[380px] overflow-y-auto py-1">
            {events.map((event) => {
              const meta = activityMeta(event);
              const isUnread =
                highlightBoundary != null &&
                tsOf(event.occurredAt) > highlightBoundary;
              return (
                <li
                  key={event.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-2.5 transition-colors",
                    isUnread ? "bg-[#fdf8ec]" : "hover:bg-[#fffbf2]/70"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      TONE_BADGE[meta.tone]
                    )}
                  >
                    <meta.Icon size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug text-[#0A261E]/90">
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#0A261E]/45">
                      {relativeShort(event.occurredAt)}
                    </p>
                  </div>
                  {isUnread ? (
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8922A]"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-[#0A261E]/8 px-4 py-2.5">
          <Link
            href="/home"
            onClick={() => setOpen(false)}
            className="block text-center text-[12.5px] font-medium text-[#0A261E]/70 transition-colors hover:text-[#0A261E]"
          >
            View all activity
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
