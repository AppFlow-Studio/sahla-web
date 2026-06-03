"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import PageHeader from "../../_components/PageHeader";
import { useCategories, type Category } from "../../_hooks/useCategories";

const EASE = [0.16, 1, 0.3, 1] as const;

type Draft = {
  key: string;
  serverId: number | null;
  name: string;
  isActive: boolean;
};

let keyCounter = 0;
const nextKey = () => `cat-${Date.now()}-${++keyCounter}`;

function categoriesToDrafts(categories: Category[]): Draft[] {
  return categories.map((c) => ({
    key: nextKey(),
    serverId: c.id,
    name: c.name,
    isActive: c.isActive,
  }));
}

function isDirty(drafts: Draft[], serverState: Category[]): boolean {
  if (drafts.length !== serverState.length) return true;
  return drafts.some((d, i) => {
    const s = serverState[i];
    return d.name.trim() !== s.name || d.isActive !== s.isActive;
  });
}

export default function CategoriesClient() {
  const { categories, isLoading, isSaving, save } = useCategories();
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Re-seed drafts whenever the server snapshot changes (initial load + after a
  // successful save). Skips while the user is in the middle of typing because
  // categories only updates on server round-trips.
  useEffect(() => {
    setDrafts(categoriesToDrafts(categories));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const dirty = isDirty(drafts, categories);

  function updateRow(index: number, updates: Partial<Draft>) {
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
      { key: nextKey(), serverId: null, name: "", isActive: true },
    ]);
  }

  function removeRow(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const valid = drafts.filter((d) => d.name.trim().length > 0);
    if (valid.length === 0) {
      toast.error("Add at least one category");
      return;
    }
    try {
      await save(
        valid.map((d) => ({
          name: d.name.trim(),
          is_active: d.isActive,
        }))
      );
      toast.success("Categories saved");
    } catch {
      // useCategories already surfaces the error toast.
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Mosque Setup"
        title="Categories"
        description="The filter pills that appear above events and programs in your mobile app's Discover tab. Rename, reorder, add new, or toggle off."
        action={
          <Button onClick={handleSave} disabled={!dirty || isSaving}>
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving
              </>
            ) : (
              <>
                <Save size={14} /> Save changes
              </>
            )}
          </Button>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white">
        <header className="border-b border-[#0A261E]/6 px-5 py-3">
          <p className="text-[12.5px] text-[#0A261E]/65">
            {isLoading
              ? "Loading…"
              : drafts.length === 0
              ? "No categories yet — add one below to get started."
              : `${drafts.length} ${drafts.length === 1 ? "category" : "categories"}.`}
          </p>
        </header>

        <div className="p-4">
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {drafts.map((row, i) => (
                <motion.li
                  key={row.key}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-xl border px-3 py-2.5",
                    row.isActive
                      ? "border-[#0A261E]/10 bg-white"
                      : "border-[#0A261E]/10 bg-[#0A261E]/[0.02] opacity-70"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveRow(i, -1)}
                      disabled={i === 0 || isSaving}
                      className="rounded-md p-0.5 text-[#0A261E]/45 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E] disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(i, 1)}
                      disabled={i === drafts.length - 1 || isSaving}
                      className="rounded-md p-0.5 text-[#0A261E]/45 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E] disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  <Input
                    value={row.name}
                    onChange={(e) => updateRow(i, { name: e.target.value })}
                    placeholder="e.g. Sisters, Reverts, Quran Club"
                    disabled={isSaving}
                  />

                  <button
                    type="button"
                    onClick={() => updateRow(i, { isActive: !row.isActive })}
                    disabled={isSaving}
                    title={row.isActive ? "Hide from app" : "Show in app"}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      row.isActive ? "bg-emerald-500" : "bg-[#0A261E]/15"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]",
                        row.isActive ? "left-[22px]" : "left-0.5"
                      )}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={isSaving}
                    className="rounded-md p-1.5 text-[#0A261E]/45 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    aria-label="Remove category"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <button
            type="button"
            onClick={addRow}
            disabled={isSaving}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#0A261E]/20 px-3 py-2.5 text-[12.5px] font-medium text-[#0A261E]/55 transition-colors hover:border-[#0A261E]/35 hover:text-[#0A261E] disabled:opacity-50"
          >
            <Plus size={13} />
            Add category
          </button>

          <p className="mt-4 text-[11.5px] text-[#0A261E]/45">
            <span className="font-medium text-[#0A261E]/70">Tip:</span> the &quot;All&quot; pill is auto-added in the app — you don&apos;t need to list it here.
          </p>
        </div>
      </section>
    </>
  );
}
