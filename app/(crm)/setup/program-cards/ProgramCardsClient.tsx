"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  LayoutList,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import PageHeader from "../../_components/PageHeader";
import {
  uploadProgramCardCover,
  useProgramCategories,
  type AudienceFilter,
  type ProgramCategory,
} from "../../_hooks/useProgramCategories";
import AssignProgramsModal from "./AssignProgramsModal";

const EASE = [0.16, 1, 0.3, 1] as const;

const AUDIENCE_FILTERS: AudienceFilter[] = ["All", "Kids", "Youth", "Adults"];

// Deep, on-brand tones for cards without a cover image.
const BG_SWATCHES = [
  "#16321F",
  "#1E3A5F",
  "#5C1F2B",
  "#3F2A5C",
  "#2E3A47",
  "#7A3B1E",
  "#1E1B4B",
];

// Default cards seeded for a mosque starting from scratch. No image_url — the
// mobile app maps these titles to its bundled Kids/Youth/Adults artwork.
const DEFAULT_DRAFTS: Omit<Draft, "key">[] = [
  { serverId: null, title: "Kids", imageUrl: null, bgColor: null, audienceFilter: "Kids" },
  { serverId: null, title: "Youth", imageUrl: null, bgColor: null, audienceFilter: "Youth" },
  { serverId: null, title: "Adults", imageUrl: null, bgColor: null, audienceFilter: "Adults" },
];

type Draft = {
  key: string;
  serverId: string | null;
  title: string;
  imageUrl: string | null;
  bgColor: string | null;
  audienceFilter: AudienceFilter;
};

let keyCounter = 0;
const nextKey = () => `pc-${Date.now()}-${++keyCounter}`;

function toDrafts(categories: ProgramCategory[]): Draft[] {
  return categories.map((c) => ({
    key: nextKey(),
    serverId: c.id,
    title: c.title,
    imageUrl: c.imageUrl,
    bgColor: c.bgColor,
    audienceFilter: c.audienceFilter,
  }));
}

function isDirty(drafts: Draft[], server: ProgramCategory[]): boolean {
  if (drafts.length !== server.length) return true;
  return drafts.some((d, i) => {
    const s = server[i];
    return (
      d.serverId !== s.id ||
      d.title.trim() !== s.title ||
      d.imageUrl !== s.imageUrl ||
      d.bgColor !== s.bgColor ||
      d.audienceFilter !== s.audienceFilter
    );
  });
}

export default function ProgramCardsClient() {
  const { categories, isLoading, isSaving, save } = useProgramCategories();
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Program-count per card (categoryId → count) for the "N programs" button.
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [assigning, setAssigning] = useState<{ id: string; title: string } | null>(
    null
  );

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/program-categories/assignments", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const body = (await res.json()) as {
        assignments?: { categoryId: string; contentId: string }[];
      };
      const next: Record<string, number> = {};
      for (const a of body.assignments ?? []) {
        next[a.categoryId] = (next[a.categoryId] ?? 0) + 1;
      }
      setCounts(next);
    } catch {
      /* counts are non-critical; ignore */
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    setDrafts(toDrafts(categories));
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
      {
        key: nextKey(),
        serverId: null,
        title: "",
        imageUrl: null,
        bgColor: null,
        audienceFilter: "All",
      },
    ]);
  }

  function seedDefaults() {
    setDrafts(DEFAULT_DRAFTS.map((d) => ({ ...d, key: nextKey() })));
  }

  function removeRow(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const valid = drafts.filter((d) => d.title.trim().length > 0);
    if (valid.length === 0) {
      toast.error("Add at least one card");
      return;
    }
    try {
      await save(
        valid.map((d) => ({
          id: d.serverId,
          title: d.title.trim(),
          imageUrl: d.imageUrl,
          bgColor: d.bgColor,
          audienceFilter: d.audienceFilter,
        }))
      );
      toast.success("Program cards saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Mosque Setup"
        title="Program Cards"
        description="The cover cards shown in the “Programs” row of your mobile app's Discover tab. Set a cover image, color, and which audience filter each card opens into."
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
              ? "No cards yet — the app falls back to default Kids / Youth / Adults cards until you add your own."
              : `${drafts.length} ${drafts.length === 1 ? "card" : "cards"}.`}
          </p>
        </header>

        <div className="p-4">
          {drafts.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="max-w-sm text-[13px] text-[#0A261E]/55">
                Start from the standard three cards, then customize each one — or
                build your own from scratch.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={seedDefaults}>
                  Start with defaults
                </Button>
                <Button onClick={addRow}>
                  <Plus size={14} /> Add a card
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                      className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-[#0A261E]/10 bg-white p-3"
                    >
                      <div className="flex flex-col gap-0.5 pt-6">
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

                      <CoverInput
                        value={row.imageUrl}
                        bgColor={row.bgColor}
                        onChange={(url) => updateRow(i, { imageUrl: url })}
                        disabled={isSaving}
                      />

                      <div className="flex min-w-0 flex-col gap-2.5">
                        <Input
                          value={row.title}
                          onChange={(e) => updateRow(i, { title: e.target.value })}
                          placeholder="Card title (e.g. Kids, Sisters)"
                          disabled={isSaving}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium text-[#0A261E]/50">
                            Opens
                          </span>
                          {AUDIENCE_FILTERS.map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => updateRow(i, { audienceFilter: f })}
                              disabled={isSaving}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                                row.audienceFilter === f
                                  ? "border-[#0A261E] bg-[#0A261E] text-white"
                                  : "border-[#0A261E]/15 text-[#0A261E]/60 hover:border-[#0A261E]/30"
                              )}
                            >
                              {f}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="mr-1 text-[11px] font-medium text-[#0A261E]/50">
                            Color
                          </span>
                          {BG_SWATCHES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                updateRow(i, {
                                  bgColor: row.bgColor === c ? null : c,
                                })
                              }
                              disabled={isSaving}
                              style={{ backgroundColor: c }}
                              className={cn(
                                "h-6 w-6 rounded-md ring-offset-1 transition-all",
                                row.bgColor === c
                                  ? "ring-2 ring-[#0A261E]"
                                  : "ring-1 ring-black/10 hover:ring-black/25"
                              )}
                              aria-label={`Background ${c}`}
                            />
                          ))}
                        </div>

                        {/* Assign which programs appear under this card. */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {row.serverId ? (
                            <button
                              type="button"
                              onClick={() =>
                                setAssigning({
                                  id: row.serverId!,
                                  title: row.title.trim() || "this card",
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A261E]/15 px-2.5 py-1 text-[11.5px] font-medium text-[#0A261E]/70 transition-colors hover:border-[#0A261E]/30 hover:text-[#0A261E]"
                            >
                              <LayoutList size={12} />
                              {counts[row.serverId]
                                ? `${counts[row.serverId]} program${
                                    counts[row.serverId] === 1 ? "" : "s"
                                  }`
                                : "Choose programs"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#0A261E]/40">
                              Save the card to assign programs
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={isSaving}
                        className="rounded-md p-1.5 text-[#0A261E]/45 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        aria-label="Remove card"
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
                Add a card
              </button>
            </>
          )}

          <p className="mt-4 text-[11.5px] text-[#0A261E]/45">
            <span className="font-medium text-[#0A261E]/70">Tip:</span> use
            “Choose programs” to pick which programs appear under each card.
            Tapping a card in the app opens the Programs tab filtered to exactly
            those programs. Cards with no cover image fall back to bundled
            artwork or the chosen color.
          </p>
        </div>
      </section>

      {assigning ? (
        <AssignProgramsModal
          categoryId={assigning.id}
          categoryTitle={assigning.title}
          onClose={() => setAssigning(null)}
          onSaved={(count) =>
            setCounts((prev) => ({ ...prev, [assigning.id]: count }))
          }
        />
      ) : null}
    </>
  );
}

// ── Cover thumbnail with click-to-upload ──────────────────────

function CoverInput({
  value,
  bgColor,
  onChange,
  disabled,
}: {
  value: string | null;
  bgColor: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadProgramCardCover(file);
      onChange(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        style={{ backgroundColor: bgColor ?? "#0A261E0D" }}
        className="flex h-[72px] w-[54px] items-center justify-center overflow-hidden rounded-lg border border-[#0A261E]/10 transition-opacity hover:opacity-90 disabled:opacity-60"
        aria-label={value ? "Replace cover" : "Add cover"}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-[#0A261E]/55" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImagePlus size={18} className="text-[#0A261E]/40" />
        )}
      </button>
      {value && !uploading ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#0A261E] shadow ring-1 ring-black/10 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Remove cover"
        >
          <X size={11} />
        </button>
      ) : null}
    </div>
  );
}
