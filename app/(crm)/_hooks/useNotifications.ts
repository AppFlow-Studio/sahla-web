"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  seedTemplates,
  seedHistory,
  type NotificationTemplate,
  type NotificationHistoryItem,
} from "../_mock/notifications";

type Listener = () => void;

type Snapshot = {
  templates: NotificationTemplate[];
  history: NotificationHistoryItem[];
};

let templates: NotificationTemplate[] = [...seedTemplates];
let history: NotificationHistoryItem[] = [...seedHistory];
const listeners = new Set<Listener>();

// Cached snapshot — useSyncExternalStore + getServerSnapshot must return the
// same reference across calls until the underlying state changes, otherwise
// React detects "new state" every render and trips into an infinite loop.
let cached: Snapshot = { templates, history };

function snapshot() {
  return cached;
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  templates = [...templates];
  history = [...history];
  cached = { templates, history };
  for (const l of listeners) l();
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 7)}`;
}

export type SendInput = {
  title: string;
  body: string;
  audienceLabel: string;
  recipientCount: number;
  /** When non-null this send was made from a template, so we bump usageCount. */
  templateId?: string | null;
};

export function useNotifications() {
  const data = useSyncExternalStore(subscribe, snapshot, snapshot);

  const send = useCallback((input: SendInput) => {
    const item: NotificationHistoryItem = {
      id: genId("ntf"),
      title: input.title,
      body: input.body,
      sentAt: new Date().toISOString(),
      audienceLabel: input.audienceLabel,
      recipientCount: input.recipientCount,
      openRate: 0,
    };
    history = [item, ...history];
    if (input.templateId) {
      templates = templates.map((t) =>
        t.id === input.templateId
          ? { ...t, usageCount: t.usageCount + 1, lastUsedAt: item.sentAt }
          : t
      );
    }
    emit();
    return item;
  }, []);

  const saveTemplate = useCallback(
    (input: Omit<NotificationTemplate, "id" | "lastUsedAt" | "usageCount">) => {
      const t: NotificationTemplate = {
        id: genId("tpl"),
        usageCount: 0,
        lastUsedAt: null,
        ...input,
      };
      templates = [t, ...templates];
      emit();
      return t;
    },
    []
  );

  const removeTemplate = useCallback((id: string) => {
    templates = templates.filter((t) => t.id !== id);
    emit();
  }, []);

  return { ...data, send, saveTemplate, removeTemplate };
}

export type { NotificationTemplate, NotificationHistoryItem };
