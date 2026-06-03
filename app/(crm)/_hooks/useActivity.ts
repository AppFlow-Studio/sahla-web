"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { seedDonations } from "../_mock/donations";
import { seedMembers } from "../_mock/members";
import { seedContent, generateRsvps } from "../_mock/programs";
import { seedHistory as seedNotifications } from "../_mock/notifications";
import { useMosque } from "../_lib/mock-mosque";

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
      kind: "content";
      id: string;
      occurredAt: string;
      contentName: string;
      contentKind: "program" | "event";
      actorName: string | null;
    }
  | {
      kind: "notification";
      id: string;
      occurredAt: string;
      title: string;
      recipientCount: number;
    }
  | {
      kind: "settings";
      id: string;
      occurredAt: string;
      label: string;
      actorName: string | null;
    };

function synthesizeFromMocks(limit: number): ActivityEvent[] {
  const items: ActivityEvent[] = [];

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
}

async function fetchActivity(limit: number): Promise<ActivityEvent[]> {
  const res = await fetch(`/api/crm/activity?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load activity (${res.status})`);
  const body = (await res.json()) as { events: ActivityEvent[] };
  return body.events ?? [];
}

/**
 * Unified activity feed for the CRM Home dashboard.
 *
 * Real data comes from `activity_log` via `/api/crm/activity`. HQ previews
 * fall back to the synthesized mock feed so the dashboard renders something
 * while QA'ing.
 */
export function useActivity(limit = 18) {
  const mosque = useMosque();

  const mockSnapshot = useMemo(
    () => (mosque.isHQ ? synthesizeFromMocks(limit) : []),
    [mosque.isHQ, limit]
  );

  const query = useQuery({
    queryKey: ["crm", "activity", mosque.id, limit],
    queryFn: () => fetchActivity(limit),
    placeholderData: [],
    enabled: !mosque.isHQ,
    staleTime: 15_000,
  });

  if (mosque.isHQ) return mockSnapshot;

  return query.data ?? [];
}
