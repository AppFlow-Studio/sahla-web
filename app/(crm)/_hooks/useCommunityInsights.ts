"use client";

import { useQuery } from "@tanstack/react-query";
import { useMosque } from "../_lib/mock-mosque";
import { EMPTY_INSIGHTS, type CommunityInsights } from "@/app/api/crm/insights/shared";

async function fetchInsights(): Promise<CommunityInsights> {
  const res = await fetch("/api/crm/insights", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load insights (${res.status})`);
  return (await res.json()) as CommunityInsights;
}

/**
 * The Insights page payload for the signed-in mosque.
 *
 * Polls and refetches on focus so the page stays current without a manual
 * refresh — the locked team standard for CRM reads.
 */
export function useCommunityInsights() {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "insights", mosque.id],
    queryFn: fetchInsights,
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  return {
    data: query.data ?? EMPTY_INSIGHTS,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export type { CommunityInsights };
