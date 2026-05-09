"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  seedContent,
  generateRsvps,
  type ContentItem,
  type ContentKind,
  type ContentRsvp,
} from "../_mock/programs";

type Listener = () => void;

let store: ContentItem[] = [...seedContent];
const listeners = new Set<Listener>();
let rsvpCache: Map<string, ContentRsvp[]> = new Map();

function snapshot() {
  return store;
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  store = [...store];
  rsvpCache = new Map();
  for (const l of listeners) l();
}

function id(prefix: "prg" | "evt") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export type ContentInput = {
  kind: ContentKind;
  name: string;
  category: string;
  description: string;
  speakerId?: string;
  speakerName: string;
  imageUrl?: string;
  startsAt: string;
  durationMin: number;
  recurrence: ContentItem["recurrence"];
  maxCapacity: number;
  isPaid: boolean;
  priceUsd?: number;
};

export function useContent(kind?: ContentKind) {
  const data = useSyncExternalStore(subscribe, snapshot, snapshot);
  const filtered = useMemo(
    () => (kind ? data.filter((d) => d.kind === kind) : data),
    [data, kind]
  );

  const add = useCallback((input: ContentInput) => {
    const item: ContentItem = {
      id: id(input.kind === "program" ? "prg" : "evt"),
      kind: input.kind,
      name: input.name,
      category: input.category,
      description: input.description,
      speakerId: input.speakerId,
      speakerName: input.speakerName,
      imageUrl:
        input.imageUrl ||
        "https://images.unsplash.com/photo-1542816417-0983c9c9ad53",
      startsAt: input.startsAt,
      durationMin: input.durationMin,
      recurrence: input.recurrence,
      maxCapacity: input.maxCapacity,
      currentCount: 0,
      isPaid: input.isPaid,
      priceUsd: input.priceUsd,
      isPublished: true,
    };
    store = [item, ...store];
    emit();
    return item;
  }, []);

  const remove = useCallback((removeId: string) => {
    store = store.filter((s) => s.id !== removeId);
    emit();
  }, []);

  return { data: filtered, add, remove };
}

export function useContentItem(itemId: string): ContentItem | null {
  const all = useSyncExternalStore(subscribe, snapshot, snapshot);
  return useMemo(() => all.find((i) => i.id === itemId) ?? null, [all, itemId]);
}

export function useContentRsvps(itemId: string): ContentRsvp[] {
  const all = useSyncExternalStore(subscribe, snapshot, snapshot);
  return useMemo(() => {
    const item = all.find((i) => i.id === itemId);
    if (!item) return [];
    if (rsvpCache.has(itemId)) return rsvpCache.get(itemId)!;
    const rows = generateRsvps(item);
    rsvpCache.set(itemId, rows);
    return rows;
  }, [all, itemId]);
}

export type { ContentItem, ContentKind, ContentRsvp };
