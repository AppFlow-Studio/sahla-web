"use client";

import { useQuery } from "@tanstack/react-query";
import { seedMembers, type Member } from "../_mock/members";
import { useMosque } from "../_lib/mock-mosque";

async function fetchMembers(): Promise<Member[]> {
  const res = await fetch("/api/crm/members", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
  const body = (await res.json()) as { members: Member[] };
  return body.members ?? [];
}

/**
 * Members directory for the signed-in mosque. Real query against
 * user_preferences → profiles via `/api/crm/members`. HQ previews fall
 * back to the seed fixture.
 */
export function useMembers() {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "members", mosque.id],
    queryFn: fetchMembers,
    placeholderData: [],
    enabled: !mosque.isHQ,
    staleTime: 30_000,
  });

  if (mosque.isHQ) {
    return { data: seedMembers };
  }

  return { data: query.data ?? [] };
}

export type { Member };
