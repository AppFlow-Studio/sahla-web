"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { cn } from "@/lib/utils";
import { INPUT_CLASS, BTN_PRIMARY } from "@/lib/ui-classes";

const AUDIENCE_FILTERS = ["All", "Kids", "Youth", "Adults"] as const;
type AudienceFilter = (typeof AUDIENCE_FILTERS)[number];

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

type CardRecord = {
  id: string;
  title: string;
  image_url: string | null;
  bg_color: string | null;
  audience_filter: string;
  sort_order: number;
};

type Draft = {
  /** Stable key for React list reconciliation across reorders. */
  key: string;
  title: string;
  imageUrl: string | null;
  bgColor: string | null;
  audienceFilter: AudienceFilter;
};

const DEFAULTS: Array<Omit<Draft, "key">> = [
  { title: "Kids", imageUrl: null, bgColor: null, audienceFilter: "Kids" },
  { title: "Youth", imageUrl: null, bgColor: null, audienceFilter: "Youth" },
  { title: "Adults", imageUrl: null, bgColor: null, audienceFilter: "Adults" },
];

let keyCounter = 0;
const nextKey = () => `pc-${Date.now()}-${++keyCounter}`;

function toAudience(value: string): AudienceFilter {
  return (AUDIENCE_FILTERS as readonly string[]).includes(value)
    ? (value as AudienceFilter)
    : "All";
}

function buildInitialDrafts(existing: CardRecord[]): Draft[] {
  if (existing.length > 0) {
    return existing.map((c) => ({
      key: nextKey(),
      title: c.title,
      imageUrl: c.image_url,
      bgColor: c.bg_color,
      audienceFilter: toAudience(c.audience_filter),
    }));
  }
  return DEFAULTS.map((d) => ({ ...d, key: nextKey() }));
}

export default function ProgramCardsOnboardingPanel({
  mosqueId,
  initialCards,
}: {
  mosqueId: string;
  initialCards: CardRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    buildInitialDrafts(initialCards)
  );
  const [saving, setSaving] = useState(false);

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
        title: "",
        imageUrl: null,
        bgColor: null,
        audienceFilter: "All",
      },
    ]);
  }

  function removeRow(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const valid = drafts.filter((d) => d.title.trim().length > 0);
    if (valid.length === 0) {
      showToast("Add at least one card", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/program-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: valid.map((d) => ({
            title: d.title.trim(),
            image_url: d.imageUrl,
            bg_color: d.bgColor,
            audience_filter: d.audienceFilter,
          })),
          markComplete: true,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to save");
      }
      showToast("Program cards saved", "success");
      router.refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to save program cards",
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
            Discover Program Cards
          </p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            The cover cards in the “Programs” row of your mobile app&apos;s
            Discover tab. Set a cover image, color, and which audience filter
            each card opens into.
          </p>
        </div>
        <div className="px-4 py-4">
          {drafts.length === 0 ? (
            <div className="px-2 py-8 text-center text-[12.5px] text-stone-500">
              No cards yet. Add one below.
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
                    className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border border-stone-200 bg-white p-3"
                  >
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 pt-6">
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

                    {/* Cover */}
                    <CoverInput
                      value={row.imageUrl}
                      bgColor={row.bgColor}
                      mosqueId={mosqueId}
                      disabled={saving}
                      onChange={(url) => updateRow(i, { imageUrl: url })}
                    />

                    <div className="flex min-w-0 flex-col gap-2.5">
                      {/* Title */}
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => updateRow(i, { title: e.target.value })}
                        placeholder="Card title (e.g. Kids, Sisters)"
                        disabled={saving}
                        className={INPUT_CLASS}
                      />

                      {/* Audience */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium text-stone-500">
                          Opens
                        </span>
                        {AUDIENCE_FILTERS.map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => updateRow(i, { audienceFilter: f })}
                            disabled={saving}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                              row.audienceFilter === f
                                ? "border-stone-900 bg-stone-900 text-white"
                                : "border-stone-200 text-stone-500 hover:border-stone-400"
                            )}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      {/* Background color */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-[11px] font-medium text-stone-500">
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
                            disabled={saving}
                            style={{ backgroundColor: c }}
                            className={cn(
                              "h-6 w-6 rounded-md ring-offset-1 transition-all",
                              row.bgColor === c
                                ? "ring-2 ring-stone-900"
                                : "ring-1 ring-black/10 hover:ring-black/25"
                            )}
                            aria-label={`Background ${c}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={saving}
                      className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      aria-label="Remove card"
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
            Add a card
          </button>

          <p className="mt-3 text-[11px] text-stone-400">
            <span className="font-medium text-stone-500">Tip:</span> tapping a
            card in the app opens the Programs tab pre-filtered to its “Opens”
            audience. Cards with no cover fall back to bundled artwork or the
            chosen color.
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

// ── Cover thumbnail with click-to-upload ──────────────────────

function CoverInput({
  value,
  bgColor,
  mosqueId,
  disabled,
  onChange,
}: {
  value: string | null;
  bgColor: string | null;
  mosqueId: string;
  disabled?: boolean;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/mosques/${mosqueId}/program-card-cover`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Upload failed");
      }
      const body = (await res.json()) as { url: string };
      onChange(body.url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
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
        style={{ backgroundColor: bgColor ?? "#f5f5f4" }}
        className="flex h-[72px] w-[54px] items-center justify-center overflow-hidden rounded-lg border border-stone-200 transition-opacity hover:opacity-90 disabled:opacity-60"
        aria-label={value ? "Replace cover" : "Add cover"}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-stone-400" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Cover" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={18} className="text-stone-400" />
        )}
      </button>
      {value && !uploading ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-stone-700 shadow ring-1 ring-black/10 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Remove cover"
        >
          <X size={11} />
        </button>
      ) : null}
    </div>
  );
}
