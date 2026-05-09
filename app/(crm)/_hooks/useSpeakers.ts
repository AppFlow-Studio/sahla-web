"use client";

import { useCallback, useSyncExternalStore } from "react";
import { seedSpeakers, type Speaker } from "../_mock/speakers";

/**
 * In-memory speaker store backing the CRM's mock data layer.
 * Replace internals with a Supabase query in the backend pass — the public
 * shape of `useSpeakers()` should not change.
 */
type Listener = () => void;

let speakers: Speaker[] = [...seedSpeakers];
const listeners = new Set<Listener>();

function snapshot() {
  return speakers;
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  speakers = [...speakers];
  for (const l of listeners) l();
}

function generateId() {
  return `spk_${Math.random().toString(36).slice(2, 8)}`;
}

export type SpeakerInput = Omit<
  Speaker,
  "id" | "programsCount" | "lastSpokeAt"
> & {
  programsCount?: number;
  lastSpokeAt?: string | null;
};

export function useSpeakers() {
  const data = useSyncExternalStore(subscribe, snapshot, snapshot);

  const add = useCallback((input: SpeakerInput) => {
    const speaker: Speaker = {
      id: generateId(),
      programsCount: input.programsCount ?? 0,
      lastSpokeAt: input.lastSpokeAt ?? null,
      ...input,
    };
    speakers = [speaker, ...speakers];
    emit();
    return speaker;
  }, []);

  const update = useCallback((id: string, patch: Partial<Speaker>) => {
    speakers = speakers.map((s) => (s.id === id ? { ...s, ...patch } : s));
    emit();
  }, []);

  const remove = useCallback((id: string) => {
    speakers = speakers.filter((s) => s.id !== id);
    emit();
  }, []);

  return { data, add, update, remove };
}
