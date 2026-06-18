"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMosque } from "../_lib/mock-mosque";
import type {
  AudienceFilter,
  CrmProgramCategory,
  CrmProgramCategoryInput,
} from "@/app/api/crm/program-categories/route";

export type ProgramCategory = CrmProgramCategory;
export type ProgramCategoryInput = CrmProgramCategoryInput;
export type { AudienceFilter };

type ListResponse = { categories: ProgramCategory[] };

async function fetchProgramCategories(): Promise<ProgramCategory[]> {
  const res = await fetch("/api/crm/program-categories", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load program cards (${res.status})`);
  const body = (await res.json()) as ListResponse;
  return body.categories ?? [];
}

async function saveProgramCategories(
  input: ProgramCategoryInput[]
): Promise<ProgramCategory[]> {
  const res = await fetch("/api/crm/program-categories", {
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

/** Upload a cover image, returning its public URL. */
export async function uploadProgramCardCover(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/crm/program-categories/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }
  const body = (await res.json()) as { url: string };
  return body.url;
}

export function useProgramCategories() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const queryKey = ["crm", "program-categories", mosque.id] as const;

  const query = useQuery({
    queryKey,
    queryFn: fetchProgramCategories,
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: saveProgramCategories,
    onSuccess: (categories) => {
      queryClient.setQueryData<ProgramCategory[]>(queryKey, categories);
    },
  });

  return {
    categories: mosque.isHQ ? [] : query.data ?? [],
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    save: (input: ProgramCategoryInput[]) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return Promise.resolve();
      }
      return saveMutation.mutateAsync(input);
    },
  };
}
