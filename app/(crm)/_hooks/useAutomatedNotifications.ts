"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AutomatedNotification } from "@/app/api/crm/notifications/automated/route";

const KEY = ["crm", "automated-notifications"] as const;

async function fetchAutomated(): Promise<AutomatedNotification[]> {
  const res = await fetch("/api/crm/notifications/automated", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load automated notifications (${res.status})`);
  const json = (await res.json()) as { notifications: AutomatedNotification[] };
  return json.notifications ?? [];
}

/** Read + edit the wording of everything the app sends on its own. */
export function useAutomatedNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: KEY, queryFn: fetchAutomated });

  const save = useMutation({
    mutationFn: async (input: {
      key: string;
      title: string;
      body: string;
      enabled: boolean;
    }) => {
      const res = await fetch("/api/crm/notifications/automated", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json().catch(() => ({}));
      // The route rejects unknown {{variables}} with a readable message —
      // surface it rather than a status code, since it's the one mistake an
      // admin is likely to make.
      if (!res.ok) throw new Error(json?.error ?? `Save failed (${res.status})`);
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success("Saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reset = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(
        `/api/crm/notifications/automated?key=${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `Reset failed (${res.status})`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success("Back to the default wording");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    save,
    reset,
  };
}
