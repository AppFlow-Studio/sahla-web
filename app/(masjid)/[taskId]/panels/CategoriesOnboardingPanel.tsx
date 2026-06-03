"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { cn } from "@/lib/utils";
import { INPUT_CLASS, BTN_PRIMARY } from "@/lib/ui-classes";

type CategoryRecord = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
};

type CategoryDraft = {
  /** Stable key for React list reconciliation across reorders. */
  key: string;
  /** Server id when this row already exists in the DB; null for new rows. */
  serverId: number | null;
  name: string;
  is_active: boolean;
};

const DEFAULTS = ["Kids", "Youth", "Adults"];

let keyCounter = 0;
const nextKey = () => `cat-${Date.now()}-${++keyCounter}`;

function buildInitialDrafts(existing: CategoryRecord[]): CategoryDraft[] {
  if (existing.length > 0) {
    return existing.map((c) => ({
      key: nextKey(),
      serverId: c.id,
      name: c.name,
      is_active: c.is_active,
    }));
  }
  return DEFAULTS.map((name) => ({
    key: nextKey(),
    serverId: null,
    name,
    is_active: true,
  }));
}

export default function CategoriesOnboardingPanel({
  mosqueId,
  initialCategories,
}: {
  mosqueId: string;
  initialCategories: CategoryRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<CategoryDraft[]>(() =>
    buildInitialDrafts(initialCategories)
  );
  const [saving, setSaving] = useState(false);

  function updateRow(index: number, updates: Partial<CategoryDraft>) {
    setDrafts((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  }

  function moveRow(index: number, direction: -1 | 1) {
    setDrafts((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addRow() {
    setDrafts((prev) => [
      ...prev,
      { key: nextKey(), serverId: null, name: "", is_active: true },
    ]);
  }

  function removeRow(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const valid = drafts.filter((d) => d.name.trim().length > 0);
    if (valid.length === 0) {
      showToast("Add at least one category", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: valid.map((d) => ({
            name: d.name.trim(),
            is_active: d.is_active,
          })),
          markComplete: true,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Failed to save");
      }
      showToast("Categories saved", "success");
      router.refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to save categories",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">
            Discover-tab Categories
          </p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            These pills appear above your events and programs in the mobile app. Rename, reorder, add new, or toggle off.
          </p>
        </div>
        <div className="px-4 py-4">
          {drafts.length === 0 ? (
            <div className="px-2 py-8 text-center text-[12.5px] text-stone-500">
              No categories yet. Add one below.
            </div>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {drafts.map((row, i) => (
                  <motion.li
                    key={row.key}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border px-3 py-2.5",
                      row.is_active
                        ? "border-stone-200 bg-white"
                        : "border-stone-200 bg-stone-50 opacity-70"
                    )}
                  >
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveRow(i, -1)}
                        disabled={i === 0 || saving}
                        className="rounded-md p-0.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRow(i, 1)}
                        disabled={i === drafts.length - 1 || saving}
                        className="rounded-md p-0.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>

                    {/* Name */}
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(i, { name: e.target.value })}
                      placeholder="e.g. Sisters, Reverts, Quran Club"
                      disabled={saving}
                      className={INPUT_CLASS}
                    />

                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        updateRow(i, { is_active: !row.is_active })
                      }
                      disabled={saving}
                      title={row.is_active ? "Hide from app" : "Show in app"}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        row.is_active ? "bg-emerald-500" : "bg-stone-300"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]",
                          row.is_active ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={saving}
                      className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      aria-label="Remove category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          <button
            type="button"
            onClick={addRow}
            disabled={saving}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-[12.5px] font-medium text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700 disabled:opacity-50"
          >
            <Plus size={13} />
            Add category
          </button>

          <p className="mt-3 text-[11px] text-stone-400">
            <span className="font-medium text-stone-500">Tip:</span> the &quot;All&quot; pill is added automatically in the app — you don&apos;t need to list it here.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(BTN_PRIMARY, saving && "opacity-60")}
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Complete"
          )}
        </button>
      </div>

    </div>
  );
}
