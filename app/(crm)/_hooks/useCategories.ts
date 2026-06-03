"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMosque } from "../_lib/mock-mosque";
import type {
  CrmCategory,
  CrmCategoryInput,
} from "@/app/api/crm/categories/route";

export type Category = CrmCategory;
export type CategoryInput = CrmCategoryInput;

type ListResponse = { categories: Category[] };

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/crm/categories", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
  const body = (await res.json()) as ListResponse;
  return body.categories ?? [];
}

async function saveCategories(input: CategoryInput[]): Promise<Category[]> {
  const res = await fetch("/api/crm/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories: input }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Save failed (${res.status})`);
  }
  const body = (await res.json()) as ListResponse;
  return body.categories ?? [];
}

export function useCategories() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const queryKey = ["crm", "categories", mosque.id] as const;

  const query = useQuery({
    queryKey,
    queryFn: fetchCategories,
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: saveCategories,
    onSuccess: (saved) => {
      queryClient.setQueryData<Category[]>(queryKey, saved);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    },
  });

  const save = useCallback(
    async (input: CategoryInput[]) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      await saveMutation.mutateAsync(input);
    },
    [saveMutation, mosque.isHQ]
  );

  return {
    categories: mosque.isHQ ? [] : query.data ?? [],
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    save,
  };
}
