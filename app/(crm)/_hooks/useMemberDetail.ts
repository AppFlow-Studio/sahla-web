"use client";

import { useQuery } from "@tanstack/react-query";
import { useMosque } from "../_lib/mock-mosque";
import type { MemberDetail } from "@/app/api/crm/members/[id]/route";

async function fetchMemberDetail(id: string): Promise<MemberDetail> {
  const res = await fetch(`/api/crm/members/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load member (${res.status})`);
  return (await res.json()) as MemberDetail;
}

/**
 * Full profile for one member, for the member profile dialog. Real query
 * against `/api/crm/members/[id]`. Disabled for HQ previews (no single mosque)
 * and until a member is selected — the dialog falls back to the list row.
 */
export function useMemberDetail(id: string | null) {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "member-detail", mosque.id, id],
    queryFn: () => fetchMemberDetail(id as string),
    enabled: !!id && !mosque.isHQ,
    staleTime: 30_000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading && !!id && !mosque.isHQ,
    isError: query.isError,
  };
}

export type { MemberDetail };
