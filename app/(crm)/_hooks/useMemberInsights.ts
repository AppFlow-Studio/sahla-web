"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMosque } from "../_lib/mock-mosque";
import { seedEnrichedMembers, seedPopular } from "../_mock/member-insights";
import {
  aggregateInsights,
  emptyInsights,
  type MemberInsights,
  type SegmentKey,
} from "@/app/api/crm/members/insights/shared";

// Captured once at module load so the HQ aggregation below stays pure (no clock
// reads during render).
const NOW = Date.now();
const CURRENT_YEAR = new Date(NOW).getFullYear();

async function fetchInsights(segment: SegmentKey): Promise<MemberInsights> {
  const res = await fetch(`/api/crm/members/insights?segment=${segment}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load member insights (${res.status})`);
  return (await res.json()) as MemberInsights;
}

/**
 * Aggregated member-insights for the signed-in mosque, scoped to `segment`.
 * Real query against `/api/crm/members/insights`; HQ previews aggregate the
 * illustrative seed locally so the chips still re-scope.
 *
 * Polls + refetches on focus so the screen stays current without a manual
 * refresh (locked team standard).
 */
export function useMemberInsights(segment: SegmentKey) {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "member-insights", mosque.id, segment],
    queryFn: () => fetchInsights(segment),
    enabled: !mosque.isHQ,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  if (mosque.isHQ) {
    return {
      data: aggregateInsights(seedEnrichedMembers, segment, seedPopular, NOW, CURRENT_YEAR),
      isIllustrative: true,
      isLoading: false,
    };
  }

  return {
    data: query.data ?? emptyInsights(segment),
    isIllustrative: false,
    isLoading: query.isLoading,
  };
}

export type { MemberInsights };
