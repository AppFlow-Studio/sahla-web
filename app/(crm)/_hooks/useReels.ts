"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMosque } from "../_lib/mock-mosque";
import type { CrmReel } from "@/app/api/crm/reels/route";

export type Reel = CrmReel;
export type ReelsScope = "own" | "global";

type ReelsListResponse = { reels: Reel[] };
type ReelsScopeResponse = { scope: ReelsScope };

async function fetchReels(): Promise<Reel[]> {
  const res = await fetch("/api/crm/reels", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load reels (${res.status})`);
  const body = (await res.json()) as ReelsListResponse;
  return body.reels ?? [];
}

async function fetchScope(): Promise<ReelsScope> {
  const res = await fetch("/api/crm/reels/scope", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load reels scope (${res.status})`);
  const body = (await res.json()) as ReelsScopeResponse;
  return body.scope;
}

async function patchScope(scope: ReelsScope): Promise<ReelsScope> {
  const res = await fetch("/api/crm/reels/scope", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to update scope (${res.status})`);
  }
  const body = (await res.json()) as { scope: ReelsScope };
  return body.scope;
}

async function deleteReel(id: string): Promise<void> {
  const res = await fetch(`/api/crm/reels?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to delete reel (${res.status})`);
  }
}

export function useReels() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const listKey = ["crm", "reels", mosque.id] as const;
  const scopeKey = ["crm", "reels-scope", mosque.id] as const;

  const listQuery = useQuery({
    queryKey: listKey,
    queryFn: fetchReels,
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 30_000,
  });

  const scopeQuery = useQuery({
    queryKey: scopeKey,
    queryFn: fetchScope,
    enabled: !mosque.isHQ,
    placeholderData: "own",
    staleTime: 30_000,
  });

  const scopeMutation = useMutation({
    mutationFn: patchScope,
    onMutate: async (scope) => {
      await queryClient.cancelQueries({ queryKey: scopeKey });
      const prev = queryClient.getQueryData<ReelsScope>(scopeKey);
      queryClient.setQueryData<ReelsScope>(scopeKey, scope);
      return { prev };
    },
    onError: (err, _scope, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(scopeKey, ctx.prev);
      toast.error(err instanceof Error ? err.message : "Couldn't update scope.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteReel,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const prev = queryClient.getQueryData<Reel[]>(listKey) ?? [];
      queryClient.setQueryData<Reel[]>(
        listKey,
        prev.filter((r) => r.id !== id)
      );
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(listKey, ctx.prev);
      toast.error(err instanceof Error ? err.message : "Couldn't remove reel.");
    },
  });

  const setScope = useCallback(
    (scope: ReelsScope) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      scopeMutation.mutate(scope);
    },
    [scopeMutation, mosque.isHQ]
  );

  const remove = useCallback(
    (id: string) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      removeMutation.mutate(id);
    },
    [removeMutation, mosque.isHQ]
  );

  const prependReel = useCallback(
    (reel: Reel) => {
      queryClient.setQueryData<Reel[]>(listKey, (prev) => [reel, ...(prev ?? [])]);
    },
    [queryClient, listKey]
  );

  return {
    reels: mosque.isHQ ? [] : listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    scope: (mosque.isHQ ? "own" : scopeQuery.data ?? "own") as ReelsScope,
    setScope,
    remove,
    prependReel,
  };
}
