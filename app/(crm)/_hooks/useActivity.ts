"use client";

import { useMemo } from "react";
import { seedDonations } from "../_mock/donations";
import { seedMembers } from "../_mock/members";
import { seedContent, generateRsvps } from "../_mock/programs";
import { seedHistory as seedNotifications } from "../_mock/notifications";

export type ActivityEvent =
  | {
      kind: "rsvp";
      id: string;
      occurredAt: string;
      memberName: string;
      contentName: string;
      contentKind: "program" | "event";
    }
  | {
      kind: "donation";
      id: string;
      occurredAt: string;
      donorHash: string;
      amountUsd: number;
      fundLabel: string;
    }
  | {
      kind: "member";
      id: string;
      occurredAt: string;
      memberName: string;
    }
  | {
      kind: "notification";
      id: string;
      occurredAt: string;
      title: string;
      recipientCount: number;
    };

/** Synthesize a unified activity feed from the other modules' fixtures. */
export function useActivity(limit = 18) {
  return useMemo(() => {
    const items: ActivityEvent[] = [];

    // Donations (most recent 10 succeeded)
    seedDonations
      .filter((d) => d.status === "succeeded")
      .slice(0, 10)
      .forEach((d) => {
        items.push({
          kind: "donation",
          id: `act-don-${d.id}`,
          occurredAt: d.occurredAt,
          donorHash: d.donorHash,
          amountUsd: d.amountUsd,
          fundLabel: d.fundLabel,
        });
      });

    // RSVPs (sample from a few content items)
    seedContent.slice(0, 5).forEach((c) => {
      const rsvps = generateRsvps(c).slice(0, 3);
      rsvps.forEach((r, i) => {
        items.push({
          kind: "rsvp",
          id: `act-rsvp-${c.id}-${i}`,
          occurredAt: r.reservedAt,
          memberName: r.memberName,
          contentName: c.name,
          contentKind: c.kind,
        });
      });
    });

    // New members (most recent signups)
    seedMembers
      .filter((m) => m.membershipKind === "new")
      .slice(0, 6)
      .forEach((m) => {
        items.push({
          kind: "member",
          id: `act-mem-${m.id}`,
          occurredAt: m.signupAt,
          memberName: m.name,
        });
      });

    // Notifications
    seedNotifications.slice(0, 4).forEach((n) => {
      items.push({
        kind: "notification",
        id: `act-ntf-${n.id}`,
        occurredAt: n.sentAt,
        title: n.title,
        recipientCount: n.recipientCount,
      });
    });

    return items
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
      .slice(0, limit);
  }, [limit]);
}
