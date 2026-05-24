"use client";

import { useQuery } from "@tanstack/react-query";
import { seedDonations, type Donation } from "../_mock/donations";
import { useMosque } from "../_lib/mock-mosque";

async function fetchDonations(): Promise<Donation[]> {
  const res = await fetch("/api/crm/donations", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load donations (${res.status})`);
  }
  const body = (await res.json()) as { donations: Donation[] };
  return body.donations ?? [];
}

/**
 * Donations for the signed-in mosque admin. Real data via `/api/crm/donations`.
 * HQ previews fall back to the mock fixture so the dashboard renders something
 * believable while QA'ing.
 */
export function useDonations() {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "donations", mosque.id],
    queryFn: fetchDonations,
    placeholderData: [],
    enabled: !mosque.isHQ,
    staleTime: 30_000,
  });

  if (mosque.isHQ) {
    return { data: seedDonations };
  }

  return { data: query.data ?? [] };
}

export type { Donation };
