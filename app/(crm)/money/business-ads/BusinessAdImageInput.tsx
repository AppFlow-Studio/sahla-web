"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadBusinessAdImage } from "../../_hooks/useBusinessAds";

const ASPECT_RATIO = 16 / 9;
// Allow ~0.5% drift on either side so a 1920×1080 image (1.7778) doesn't
// get rejected for floating-point reasons but a 4:3 image (1.333) does.
const ASPECT_TOLERANCE = 0.01;
const MAX_BYTES = 5 * 1024 * 1024;

async function readDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read image"));
    };
    img.src = url;
  });
}

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string;
};

export default function BusinessAdImageInput({ value, onChange, error }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 5 MB");
      return;
    }
    let dims: { width: number; height: number };
    try {
      dims = await readDimensions(file);
    } catch {
      toast.error("Couldn't read that image — try another file");
      return;
    }
    const ratio = dims.width / dims.height;
    if (Math.abs(ratio - ASPECT_RATIO) > ASPECT_TOLERANCE) {
      toast.error(
        `Image must be 16:9 (got ${dims.width}×${dims.height} ≈ ${ratio.toFixed(2)}:1)`
      );
      return;
    }

    setUploading(true);
    try {
      const url = await uploadBusinessAdImage(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-[#0A261E]/10 bg-[#0A261E]/[0.03]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Ad preview"
            className="aspect-video w-full object-cover"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#0A261E] shadow-sm transition-colors hover:bg-white disabled:opacity-60"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={uploading}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-[#0A261E] shadow-sm transition-colors hover:bg-white disabled:opacity-60"
              aria-label="Remove image"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors ${
            dragOver
              ? "border-[#B8922A] bg-[#fffbf2]"
              : error
              ? "border-red-300 bg-red-50/40"
              : "border-[#0A261E]/15 bg-[#0A261E]/[0.02] hover:border-[#0A261E]/25 hover:bg-[#0A261E]/[0.04]"
          } disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin text-[#0A261E]/55" />
              <p className="text-[12px] text-[#0A261E]/55">Uploading...</p>
            </>
          ) : (
            <>
              <ImagePlus size={22} className="text-[#0A261E]/45" />
              <div>
                <p className="text-[13px] font-semibold text-[#0A261E]">
                  Drop your ad image, or click to upload
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#0A261E]/55">
                  Must be 16:9 (e.g. 1920×1080) · PNG / JPG / WebP · ≤ 5 MB
                </p>
              </div>
            </>
          )}
        </button>
      )}
      {error ? (
        <p className="mt-1.5 text-[12px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
