"use client";

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { CrmJummahSlot } from "@/app/api/crm/jummah/route";
import { useMosque } from "../_lib/mock-mosque";

export type JummahInput = {
  prayerTime: string;
  topic?: string;
  speakerId?: string | null;
};

async function fetchSlots(): Promise<CrmJummahSlot[]> {
  const res = await fetch("/api/crm/jummah", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load jummah (${res.status})`);
  const body = (await res.json()) as { slots: CrmJummahSlot[] };
  return body.slots ?? [];
}

async function createSlot(input: JummahInput): Promise<CrmJummahSlot> {
  const res = await fetch("/api/crm/jummah", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Add failed (${res.status})`);
  }
  const body = (await res.json()) as { slot: CrmJummahSlot };
  return body.slot;
}

async function patchSlot(id: string, input: Partial<JummahInput>): Promise<void> {
  const res = await fetch(`/api/crm/jummah/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Update failed (${res.status})`);
  }
}

async function deleteSlot(id: string): Promise<void> {
  const res = await fetch(`/api/crm/jummah/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Delete failed (${res.status})`);
  }
}

/**
 * Jummah slots for the signed-in mosque. Backed by the `jummah` table that
 * onboarding's JummahSetupPanel writes to. HQ previews see an empty list.
 */
export function useJummah() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const queryKey = ["crm", "jummah", mosque.id] as const;

  const query = useQuery({
    queryKey,
    queryFn: fetchSlots,
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: createSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Jummah slot added");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't add jummah.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<JummahInput> }) =>
      patchSlot(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't update.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't remove.");
    },
  });

  const add = useCallback(
    (input: JummahInput) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      addMutation.mutate(input);
    },
    [addMutation, mosque.isHQ]
  );

  const update = useCallback(
    (id: string, input: Partial<JummahInput>) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      updateMutation.mutate({ id, input });
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

  return { data: query.data ?? [], add, update, remove };
}

export type { CrmJummahSlot };
