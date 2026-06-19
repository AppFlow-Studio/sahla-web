"use client";

import { useCallback } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  seedTemplates,
  seedHistory,
  type NotificationTemplate,
  type NotificationHistoryItem,
} from "../_mock/notifications";
import { useMosque } from "../_lib/mock-mosque";

export type SendAudienceType = "all" | "program" | "event";

export type SendInput = {
  title: string;
  body: string;
  audienceType: SendAudienceType;
  audienceTarget?: string | null;
  audienceLabel: string;
  templateId?: string | null;
  /** ISO string for a future send; omit/null for immediate. */
  scheduledFor?: string | null;
};

export type SendResult =
  | { scheduled: true; scheduledFor: string }
  | {
      scheduled: false;
      status: string;
      sentCount: number | null;
      failedCount: number | null;
      recipientCount: number | null;
    };

async function fetchTemplates(): Promise<NotificationTemplate[]> {
  const res = await fetch("/api/crm/notifications/templates", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
  const body = (await res.json()) as { templates: NotificationTemplate[] };
  return body.templates ?? [];
}

async function fetchHistory(): Promise<NotificationHistoryItem[]> {
  const res = await fetch("/api/crm/notifications/history", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load history (${res.status})`);
  const body = (await res.json()) as { history: NotificationHistoryItem[] };
  return body.history ?? [];
}

async function postTemplate(
  input: Omit<NotificationTemplate, "id" | "lastUsedAt" | "usageCount">
): Promise<NotificationTemplate> {
  const res = await fetch("/api/crm/notifications/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      title: input.title,
      body: input.body,
      audience: input.audience,
      audienceLabel: input.audienceLabel,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Save failed (${res.status})`);
  }
  const body = (await res.json()) as { template: NotificationTemplate };
  return body.template;
}

async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(
    `/api/crm/notifications/templates?id=${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Delete failed (${res.status})`);
  }
}

async function postSend(input: SendInput): Promise<SendResult> {
  const res = await fetch("/api/crm/notifications/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Send failed (${res.status})`);
  }
  return (await res.json()) as SendResult;
}

/**
 * Notifications backed by `notification_templates` (templates) and
 * `activity_log` rows with action='notification_sent' (history).
 *
 * Send enqueues onto `scheduled_notifications`; the `send-push` edge function
 * (drain worker) resolves the audience to Expo push tokens and delivers via
 * exp.host. Immediate sends kick the worker inline and return real counts;
 * scheduled sends are drained by a per-minute cron.
 */
export function useNotifications() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const tplKey = ["crm", "notifications", "templates", mosque.id] as const;
  const histKey = ["crm", "notifications", "history", mosque.id] as const;

  const templatesQuery = useQuery({
    queryKey: tplKey,
    queryFn: fetchTemplates,
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 30_000,
  });

  const historyQuery = useQuery({
    queryKey: histKey,
    queryFn: fetchHistory,
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 15_000,
  });

  const sendMutation = useMutation({
    mutationFn: postSend,
    onSuccess: (result, input) => {
      if (result.scheduled) {
        toast.success(
          `Scheduled for ${new Date(result.scheduledFor).toLocaleString()}`,
          { description: input.title }
        );
      } else if (result.sentCount != null) {
        const failed = result.failedCount ?? 0;
        toast.success(
          `Sent to ${result.sentCount} ${
            result.sentCount === 1 ? "device" : "devices"
          }${failed > 0 ? ` · ${failed} failed` : ""}`,
          { description: input.title }
        );
      } else {
        // Worker hasn't finished yet (the inline kick didn't return counts);
        // the cron will deliver shortly.
        toast.success("Queued — delivering now", { description: input.title });
      }
      queryClient.invalidateQueries({ queryKey: histKey });
      queryClient.invalidateQueries({ queryKey: tplKey });
      queryClient.invalidateQueries({
        queryKey: ["crm", "activity", mosque.id],
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't send.");
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: postTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tplKey }),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't save template.");
    },
  });

  const removeTemplateMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tplKey }),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't remove template.");
    },
  });

  const send = useCallback(
    (input: SendInput) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't actually send.");
        return;
      }
      sendMutation.mutate(input);
    },
    [sendMutation, mosque.isHQ]
  );

  const saveTemplate = useCallback(
    (input: Omit<NotificationTemplate, "id" | "lastUsedAt" | "usageCount">) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      saveTemplateMutation.mutate(input);
    },
    [saveTemplateMutation, mosque.isHQ]
  );

  const removeTemplate = useCallback(
    (id: string) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      removeTemplateMutation.mutate(id);
    },
    [removeTemplateMutation, mosque.isHQ]
  );

  return {
    templates: mosque.isHQ ? seedTemplates : templatesQuery.data ?? [],
    history: mosque.isHQ ? seedHistory : historyQuery.data ?? [],
    send,
    saveTemplate,
    removeTemplate,
  };
}

export type { NotificationTemplate, NotificationHistoryItem };
