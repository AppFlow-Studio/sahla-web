"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { seedSpeakers, type Speaker } from "../_mock/speakers";
import { useMosque } from "../_lib/mock-mosque";

type SpeakerListResponse = { speakers: Speaker[] };
type SpeakerOneResponse = { speaker: Speaker };

async function fetchSpeakers(): Promise<Speaker[]> {
  const res = await fetch("/api/crm/speakers", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load speakers (${res.status})`);
  const body = (await res.json()) as SpeakerListResponse;
  return body.speakers ?? [];
}

export type SpeakerInput = Omit<Speaker, "id" | "programsCount" | "lastSpokeAt">;

async function createSpeaker(input: SpeakerInput): Promise<Speaker> {
  const res = await fetch("/api/crm/speakers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      credentials: input.credentials,
      bio: input.bio,
      photoUrl: input.photoUrl,
      email: input.email,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to create speaker (${res.status})`);
  }
  const body = (await res.json()) as SpeakerOneResponse;
  return body.speaker;
}

async function patchSpeaker(id: string, patch: Partial<Speaker>): Promise<Speaker> {
  const res = await fetch("/api/crm/speakers", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      name: patch.name,
      credentials: patch.credentials,
      bio: patch.bio,
      photoUrl: patch.photoUrl,
      email: patch.email,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to update speaker (${res.status})`);
  }
  const body = (await res.json()) as SpeakerOneResponse;
  return body.speaker;
}

async function deleteSpeaker(id: string): Promise<void> {
  const res = await fetch(`/api/crm/speakers?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to delete speaker (${res.status})`);
  }
}

function makeOptimisticSpeaker(input: SpeakerInput): Speaker {
  return {
    id: `optimistic_${Math.random().toString(36).slice(2, 8)}`,
    programsCount: 0,
    lastSpokeAt: null,
    ...input,
  };
}

/**
 * Speakers CRUD with optimistic add/update/remove. Replaces the in-memory
 * useSyncExternalStore from the UI phase; same public API (data + add +
 * update + remove) so consumers (SpeakersClient, content wizard's speaker
 * picker) didn't need to change.
 *
 * HQ previews short-circuit to the seed fixture so QA isn't blocked on
 * having a real mosque.
 */
export function useSpeakers() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const queryKey = ["crm", "speakers", mosque.id] as const;

  const query = useQuery({
    queryKey,
    queryFn: fetchSpeakers,
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: createSpeaker,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Speaker[]>(queryKey) ?? [];
      const optimistic = makeOptimisticSpeaker(input);
      queryClient.setQueryData<Speaker[]>(queryKey, [optimistic, ...previous]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      toast.error(err instanceof Error ? err.message : "Couldn't add speaker.");
    },
    onSuccess: (created, _input, ctx) => {
      // Swap the optimistic placeholder for the real row.
      queryClient.setQueryData<Speaker[]>(queryKey, (prev) =>
        (prev ?? []).map((s) => (s.id === ctx?.optimisticId ? created : s))
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Speaker> }) =>
      patchSpeaker(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Speaker[]>(queryKey) ?? [];
      queryClient.setQueryData<Speaker[]>(queryKey, (prev) =>
        (prev ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      toast.error(err instanceof Error ? err.message : "Couldn't update speaker.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteSpeaker,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Speaker[]>(queryKey) ?? [];
      queryClient.setQueryData<Speaker[]>(
        queryKey,
        previous.filter((s) => s.id !== id)
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      toast.error(err instanceof Error ? err.message : "Couldn't remove speaker.");
    },
  });

  const add = useCallback(
    (input: SpeakerInput) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return makeOptimisticSpeaker(input);
      }
      return addMutation.mutate(input);
    },
    [addMutation, mosque.isHQ]
  );

  const update = useCallback(
    (id: string, patch: Partial<Speaker>) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      updateMutation.mutate({ id, patch });
    },
    [updateMutation, mosque.isHQ]
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

  const data = mosque.isHQ ? seedSpeakers : query.data ?? [];

  return { data, add, update, remove };
}

export type { Speaker };
