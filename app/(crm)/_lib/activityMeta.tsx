import {
  Bell,
  CalendarCheck,
  Heart,
  Sparkles,
  UserPlus,
} from "lucide-react";
import type { ActivityEvent } from "../_hooks/useActivity";
import { formatUsd } from "./format";

export type ActivityTone =
  | "donation"
  | "rsvp"
  | "member"
  | "notification"
  | "content"
  | "settings";

/** Badge background + text classes per event tone. */
export const TONE_BADGE: Record<ActivityTone, string> = {
  donation: "bg-emerald-50 text-emerald-700",
  rsvp: "bg-[#0A261E]/[0.06] text-[#0A261E]/70",
  member: "bg-[#fffbf2] text-[#B8922A]",
  notification: "bg-amber-50 text-amber-700",
  content: "bg-violet-50 text-violet-700",
  settings: "bg-sky-50 text-sky-700",
};

/**
 * Map a unified `ActivityEvent` to the icon, tone, and human-readable label
 * shared by the Home feed and the TopBar notification inbox. Single source of
 * truth so both surfaces phrase events identically.
 */
export function activityMeta(event: ActivityEvent): {
  Icon: typeof Heart;
  tone: ActivityTone;
  label: React.ReactNode;
} {
  switch (event.kind) {
    case "donation":
      return {
        Icon: Heart,
        tone: "donation",
        label: (
          <>
            <span className="font-semibold text-[#0A261E]">
              {event.donorHash}
            </span>{" "}
            donated{" "}
            <span className="font-semibold tabular-nums">
              {formatUsd(event.amountUsd)}
            </span>{" "}
            to {event.fundLabel}
          </>
        ),
      };
    case "rsvp":
      return {
        Icon: CalendarCheck,
        tone: "rsvp",
        label: (
          <>
            <span className="font-semibold text-[#0A261E]">
              {event.memberName}
            </span>{" "}
            RSVP&apos;d to{" "}
            <span className="font-semibold text-[#0A261E]">
              {event.contentName}
            </span>
          </>
        ),
      };
    case "member":
      return {
        Icon: UserPlus,
        tone: "member",
        label: (
          <>
            <span className="font-semibold text-[#0A261E]">
              {event.memberName}
            </span>{" "}
            joined the mosque app
          </>
        ),
      };
    case "notification":
      return {
        Icon: Bell,
        tone: "notification",
        label: (
          <>
            Notification &ldquo;
            <span className="font-semibold text-[#0A261E]">{event.title}</span>
            &rdquo; sent to{" "}
            <span className="tabular-nums">
              {event.recipientCount.toLocaleString()}
            </span>
          </>
        ),
      };
    case "content":
      return {
        Icon: CalendarCheck,
        tone: "content",
        label: (
          <>
            {event.actorName ? (
              <span className="font-semibold text-[#0A261E]">
                {event.actorName}
              </span>
            ) : (
              <span className="font-semibold text-[#0A261E]">You</span>
            )}{" "}
            created {event.contentKind === "event" ? "event" : "program"}{" "}
            <span className="font-semibold text-[#0A261E]">
              {event.contentName}
            </span>
          </>
        ),
      };
    case "settings":
      return {
        Icon: Sparkles,
        tone: "settings",
        label: (
          <>
            <span className="font-semibold text-[#0A261E]">
              {event.actorName ?? "You"}
            </span>{" "}
            updated{" "}
            <span className="font-semibold text-[#0A261E]">{event.label}</span>
          </>
        ),
      };
  }
}
