"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMosque } from "../_lib/mock-mosque";
import type { CrmBusinessAd } from "@/app/api/crm/business-ads/route";

export type BusinessAd = CrmBusinessAd;

export type BusinessAdInput = {
  businessName: string;
  businessAddress?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  placement?: string;
  durationMonths?: number;
  imageUrl: string;
};

type ListResponse = { ads: BusinessAd[] };
type OneResponse = { ad: BusinessAd };

async function fetchAds(): Promise<BusinessAd[]> {
  const res = await fetch("/api/crm/business-ads", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load business ads (${res.status})`);
  const body = (await res.json()) as ListResponse;
  return body.ads ?? [];
}

async function createAd(input: BusinessAdInput): Promise<BusinessAd> {
  const res = await fetch("/api/crm/business-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to create ad (${res.status})`);
  }
  const body = (await res.json()) as OneResponse;
  return body.ad;
}

async function patchAd(
  id: string,
  patch: Partial<BusinessAdInput>
): Promise<BusinessAd> {
  const res = await fetch("/api/crm/business-ads", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...patch }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to update ad (${res.status})`);
  }
  const body = (await res.json()) as OneResponse;
  return body.ad;
}

async function deleteAd(id: string): Promise<void> {
  const res = await fetch(`/api/crm/business-ads?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to delete ad (${res.status})`);
  }
}

export async function uploadBusinessAdImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/crm/business-ads/upload", {
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

function makeOptimistic(input: BusinessAdInput): BusinessAd {
  return {
    id: `optimistic_${Math.random().toString(36).slice(2, 8)}`,
    businessName: input.businessName,
    businessAddress: input.businessAddress ?? null,
    contactName: input.contactName ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    placement: input.placement ?? null,
    durationMonths: input.durationMonths ?? null,
    imageUrl: input.imageUrl,
    status: "approved",
    createdAt: new Date().toISOString(),
  };
}

export function useBusinessAds() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const queryKey = ["crm", "business-ads", mosque.id] as const;

  const query = useQuery({
    queryKey,
    queryFn: fetchAds,
    enabled: !mosque.isHQ,
    placeholderData: [],
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: createAd,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BusinessAd[]>(queryKey) ?? [];
      const optimistic = makeOptimistic(input);
      queryClient.setQueryData<BusinessAd[]>(queryKey, [optimistic, ...previous]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      toast.error(err instanceof Error ? err.message : "Couldn't add ad.");
    },
    onSuccess: (created, _input, ctx) => {
      queryClient.setQueryData<BusinessAd[]>(queryKey, (prev) =>
        (prev ?? []).map((a) => (a.id === ctx?.optimisticId ? created : a))
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BusinessAdInput> }) =>
      patchAd(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BusinessAd[]>(queryKey) ?? [];
      queryClient.setQueryData<BusinessAd[]>(queryKey, (prev) =>
        (prev ?? []).map((a) =>
          a.id === id
            ? {
                ...a,
                businessName: patch.businessName ?? a.businessName,
                businessAddress: patch.businessAddress ?? a.businessAddress,
                contactName: patch.contactName ?? a.contactName,
                contactEmail: patch.contactEmail ?? a.contactEmail,
                contactPhone: patch.contactPhone ?? a.contactPhone,
                placement: patch.placement ?? a.placement,
                durationMonths: patch.durationMonths ?? a.durationMonths,
                imageUrl: patch.imageUrl ?? a.imageUrl,
              }
            : a
        )
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      toast.error(err instanceof Error ? err.message : "Couldn't update ad.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteAd,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BusinessAd[]>(queryKey) ?? [];
      queryClient.setQueryData<BusinessAd[]>(
        queryKey,
        previous.filter((a) => a.id !== id)
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
      toast.error(err instanceof Error ? err.message : "Couldn't remove ad.");
    },
  });

  const add = useCallback(
    (input: BusinessAdInput) => {
      if (mosque.isHQ) {
        toast("HQ preview — won't persist.");
        return;
      }
      addMutation.mutate(input);
    },
    [addMutation, mosque.isHQ]
  );

  const update = useCallback(
    (id: string, patch: Partial<BusinessAdInput>) => {
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

  return {
    data: mosque.isHQ ? [] : query.data ?? [],
    isLoading: query.isLoading,
    add,
    update,
    remove,
  };
}
