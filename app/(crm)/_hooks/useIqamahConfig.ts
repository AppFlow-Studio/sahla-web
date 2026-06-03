"use client";

import { useQuery } from "@tanstack/react-query";
import { useMosque } from "../_lib/mock-mosque";
import type { CrmPrayerTimesPayload } from "@/app/api/crm/prayer-times/route";

async function fetchPrayerTimes(): Promise<CrmPrayerTimesPayload> {
  const res = await fetch("/api/crm/prayer-times", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load prayer times (${res.status})`);
  return (await res.json()) as CrmPrayerTimesPayload;
}

const HQ_FALLBACK: CrmPrayerTimesPayload = {
  calculation_method: 2,
  school: 0,
  iqamah: [],
};

/**
 * Loads the signed-in mosque's calculation method, Asr school, and iqamah
 * config rows in one request. HQ previews see the AlAdhan defaults.
 */
export function useIqamahConfig() {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "prayer-times", mosque.id],
    queryFn: fetchPrayerTimes,
    enabled: !mosque.isHQ,
    staleTime: 30_000,
  });

  if (mosque.isHQ) {
    return { data: HQ_FALLBACK, isLoading: false };
  }

  return {
    data: query.data ?? HQ_FALLBACK,
    isLoading: query.isLoading,
  };
}

export type { CrmPrayerTimesPayload };
