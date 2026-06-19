"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMosque } from "../_lib/mock-mosque";
import {
  emptyInsights,
  type MemberInsights,
  type SegmentKey,
} from "@/app/api/crm/members/insights/shared";

async function fetchInsights(segment: SegmentKey): Promise<MemberInsights> {
  const res = await fetch(`/api/crm/members/insights?segment=${segment}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load member insights (${res.status})`);
  return (await res.json()) as MemberInsights;
}

/**
 * Aggregated member-insights for the signed-in mosque, scoped to `segment`.
 * Real query against `/api/crm/members/insights`.
 *
 * Polls + refetches on focus so the screen stays current without a manual
 * refresh (locked team standard).
 */
export function useMemberInsights(segment: SegmentKey) {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "member-insights", mosque.id, segment],
    queryFn: () => fetchInsights(segment),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    data: query.data ?? emptyInsights(segment),
    isLoading: query.isLoading,
  };
}

export type { MemberInsights };
