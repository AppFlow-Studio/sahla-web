"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useToast } from "./ToastProvider";

/**
 * Cover-image picker for content_items (events, programs). Uploads straight to
 * Bunny via /api/mosques/[id]/content-image and hands the parent the public CDN
 * URL to persist on the row — the mobile app renders that URL directly.
 */
export default function CoverImageUpload({
  value,
  mosqueId,
  disabled,
  onChange,
}: {
  value: string | null;
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
      const res = await fetch(`/api/mosques/${mosqueId}/content-image`, {
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
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          // Reset so picking the same file twice still fires a change.
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover" className="h-36 w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-stone-700 shadow-sm backdrop-blur transition-colors hover:bg-white disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled || uploading}
              aria-label="Remove cover image"
              className="rounded-md bg-white/90 p-1.5 text-stone-500 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-red-500 disabled:opacity-60"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 bg-white text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin text-stone-400" />
          ) : (
            <>
              <ImagePlus size={18} className="text-stone-400" />
              <span className="text-[12px] font-medium">Add cover image</span>
              <span className="text-[10.5px] text-stone-400">PNG, JPG or WebP · max 5 MB</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
