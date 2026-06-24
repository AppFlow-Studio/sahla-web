"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Upload,
  Trash2,
  Globe2,
  Building2,
  Play,
} from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { cn } from "@/lib/utils";
import { INPUT_CLASS, LABEL_CLASS, BTN_PRIMARY } from "@/lib/ui-classes";

type ReelRecord = {
  reel_id: string;
  title: string | null;
  caption: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_sec: number | null;
  created_at: string;
};

type ReelsScope = "own" | "global";

const ACCEPTED_VIDEO_TYPES = "video/mp4,video/webm";
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB — Bunny streaming handles it fine.

/**
 * Browsers (especially Chrome + Firefox) can't play HEVC/H.265, which is what
 * iPhone + Mac QuickTime recordings default to inside .mov containers.
 * Reject .mov upfront with a clear conversion hint instead of letting admins
 * upload a 200 MB file that silently won't play.
 */
function rejectIfUnsupportedFormat(file: File): string | null {
  const name = file.name.toLowerCase();
  if (
    file.type === "video/quicktime" ||
    file.type === "video/x-m4v" ||
    name.endsWith(".mov") ||
    name.endsWith(".m4v")
  ) {
    return "MOV/M4V isn't supported in browsers — export as MP4 (H.264) and try again.";
  }
  if (file.type && !file.type.startsWith("video/")) {
    return "That doesn't look like a video file.";
  }
  return null;
}

export default function ReelsOnboardingPanel({
  mosqueId,
  initialScope,
  initialReels,
}: {
  mosqueId: string;
  initialScope: ReelsScope;
  initialReels: ReelRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scope, setScope] = useState<ReelsScope>(initialScope);
  const [reels, setReels] = useState<ReelRecord[]>(initialReels);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleUpload() {
    if (!selectedFile) {
      showToast("Pick a video file first", "error");
      return;
    }
    const formatError = rejectIfUnsupportedFormat(selectedFile);
    if (formatError) {
      showToast(formatError, "error");
      return;
    }
    if (selectedFile.size > MAX_BYTES) {
      showToast("Video must be under 200 MB", "error");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      showToast("Supabase URL not configured", "error");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("mosque_id", mosqueId);
      if (title.trim()) form.append("title", title.trim());
      if (caption.trim()) form.append("caption", caption.trim());

      const res = await fetch(`${supabaseUrl}/functions/v1/reels-upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Upload failed (${res.status})`);
      }
      const body = (await res.json()) as { reel: ReelRecord };
      setReels((prev) => [body.reel, ...prev]);
      setTitle("");
      setCaption("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Reel uploaded", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Couldn't upload reel",
        "error"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(reelId: string) {
    setRemovingId(reelId);
    try {
      const res = await fetch(
        `/api/mosques/${mosqueId}/reels?id=${encodeURIComponent(reelId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      setReels((prev) => prev.filter((r) => r.reel_id !== reelId));
      showToast("Reel removed", "success");
    } catch {
      showToast("Couldn't remove reel", "error");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleSaveAndComplete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reels_scope: scope,
          markComplete: "reels",
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("Reels setup complete", "success");
      router.refresh();
    } catch {
      showToast("Failed to save reels setup", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Scope toggle */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">
            Reels Feed Scope
          </p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            Decide what plays in your app&apos;s Reels tab.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-2">
          {(
            [
              {
                value: "own" as const,
                label: "My Mosque Only",
                description:
                  "Users see just the reels you upload. Best for tight-knit community content.",
                icon: Building2,
              },
              {
                value: "global" as const,
                label: "Include Global Reels",
                description:
                  "Users see your reels plus reels from every Sahla mosque. Broader feed, more variety.",
                icon: Globe2,
              },
            ]
          ).map((opt) => {
            const active = scope === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScope(opt.value)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition-all",
                  active
                    ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                    : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-500"
                  )}
                >
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-stone-900">
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[12px] text-stone-500">
                    {opt.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                    active ? "border-emerald-600" : "border-stone-300"
                  )}
                >
                  {active && <div className="h-2 w-2 rounded-full bg-emerald-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">
            Upload a Reel
          </p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            MP4 (H.264) or WebM, up to 200 MB. Vertical 9:16 plays best.
          </p>
          <p className="mt-1 text-[11px] text-stone-400">
            On iPhone: Settings → Camera → Formats → <span className="font-medium">Most Compatible</span>. On Mac: re-export QuickTime recordings as MP4 before uploading.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className={LABEL_CLASS}>Video file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_VIDEO_TYPES}
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
              className="block w-full text-[13px] text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-[12px] file:font-medium file:text-white file:transition-colors file:hover:bg-stone-700 disabled:opacity-60"
            />
            {selectedFile ? (
              <p className="mt-1.5 text-[11px] text-stone-500">
                Selected: {selectedFile.name} (
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Friday reminder"
                disabled={uploading}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Caption (optional)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Quick thought from Imam Yusuf"
                disabled={uploading}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={cn(
                BTN_PRIMARY,
                (!selectedFile || uploading) && "opacity-60"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload Reel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded reels list */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">
            Your Reels
          </p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            {reels.length === 0
              ? "Nothing here yet — upload your first reel above."
              : `${reels.length} ${reels.length === 1 ? "reel" : "reels"} live in your app right now.`}
          </p>
        </div>
        {reels.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <Play size={18} className="text-stone-400" />
            </div>
            <p className="mt-3 text-[12px] text-stone-500">
              No reels yet.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {reels.map((reel) => (
                <motion.li
                  key={reel.reel_id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-lg border border-stone-200 bg-white"
                >
                  <div className="relative aspect-[9/16] w-full bg-stone-900">
                    {/*
                      preload="auto" so the browser buffers enough to seek
                      smoothly. Some uploaded MP4s don't have the moov atom
                      faststarted, which makes range-request seeks stall on
                      preload="metadata"; auto sidesteps that at the cost of
                      a fuller initial download (fine for the onboarding
                      panel where admins have only a handful of reels).
                    */}
                    <video
                      src={reel.video_url}
                      preload="auto"
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2 px-3 py-2.5">
                    <p className="line-clamp-1 text-[13px] font-semibold text-stone-900">
                      {reel.title || "Untitled reel"}
                    </p>
                    {reel.caption ? (
                      <p className="line-clamp-2 text-[11.5px] text-stone-500">
                        {reel.caption}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10.5px] text-stone-400">
                        {new Date(reel.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(reel.reel_id)}
                        disabled={removingId === reel.reel_id}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                      >
                        {removingId === reel.reel_id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Trash2 size={11} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveAndComplete}
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
