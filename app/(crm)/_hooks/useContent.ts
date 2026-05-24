"use client";

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  seedContent,
  generateRsvps,
  type ContentItem,
  type ContentKind,
  type ContentRsvp,
} from "../_mock/programs";
import { useMosque } from "../_lib/mock-mosque";

/** Wizard payload — the shape the new schedule step emits. */
export type ContentWizardInput = {
  kind: ContentKind;
  name: string;
  description: string;
  speakerId?: string;
  speakerName: string;
  imageUrl?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  startTime: string; // HH:MM
  days: string[]; // ["monday","wednesday",...] — [] for one-off events
  maxCapacity: number;
  isPaid: boolean;
  priceUsd?: number;
};

async function fetchContent(kind?: ContentKind): Promise<ContentItem[]> {
  const url = kind ? `/api/crm/content?kind=${kind}` : "/api/crm/content";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load content (${res.status})`);
  const body = (await res.json()) as { items: ContentItem[] };
  return body.items ?? [];
}

async function createContent(input: ContentWizardInput): Promise<ContentItem> {
  const res = await fetch("/api/crm/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to create (${res.status})`);
  }
  const body = (await res.json()) as { item: ContentItem };
  return body.item;
}

async function deleteContent(id: string): Promise<void> {
  const res = await fetch(`/api/crm/content/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to delete (${res.status})`);
  }
}

async function fetchContentItem(id: string): Promise<ContentItem | null> {
  const res = await fetch(`/api/crm/content/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load item (${res.status})`);
  const body = (await res.json()) as { item: ContentItem | null };
  return body.item;
}

async function fetchContentRsvps(id: string): Promise<ContentRsvp[]> {
  const res = await fetch(
    `/api/crm/content/${encodeURIComponent(id)}/rsvps`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to load RSVPs (${res.status})`);
  const body = (await res.json()) as { rsvps: ContentRsvp[] };
  return body.rsvps ?? [];
}

/**
 * Content list + create + delete. Same public API the mock had — consumers
 * (ContentListClient, ContentDetailClient, CreateContentWizard) work
 * unchanged.
 */
export function useContent(kind?: ContentKind) {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const queryKey = ["crm", "content", mosque.id, kind ?? "all"] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchContent(kind),
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: createContent,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["crm", "content", mosque.id] });
      toast.success(
        `${created.kind === "event" ? "Event" : "Program"} published: ${created.name}`
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't publish.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "content", mosque.id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't delete.");
    },
  });

  const add = useCallback(
    (input: ContentWizardInput) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      addMutation.mutate(input);
    },
    [addMutation, mosque.isHQ]
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

  const data = mosque.isHQ
    ? kind
      ? seedContent.filter((c) => c.kind === kind)
      : seedContent
    : query.data ?? [];

  return { data, add, remove };
}

export function useContentItem(itemId: string): ContentItem | null {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "content", mosque.id, "item", itemId],
    queryFn: () => fetchContentItem(itemId),
    enabled: !mosque.isHQ && !!itemId,
    staleTime: 30_000,
  });

  if (mosque.isHQ) {
    return seedContent.find((c) => c.id === itemId) ?? null;
  }
  return query.data ?? null;
}

export function useContentRsvps(itemId: string): ContentRsvp[] {
  const mosque = useMosque();

  const query = useQuery({
    queryKey: ["crm", "content", mosque.id, "rsvps", itemId],
    queryFn: () => fetchContentRsvps(itemId),
    enabled: !mosque.isHQ && !!itemId,
    placeholderData: [],
    staleTime: 15_000,
  });

  if (mosque.isHQ) {
    const item = seedContent.find((c) => c.id === itemId);
    return item ? generateRsvps(item) : [];
  }
  return query.data ?? [];
}

export type { ContentItem, ContentKind, ContentRsvp };
