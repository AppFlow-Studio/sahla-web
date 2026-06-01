"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMosque } from "../../_lib/mock-mosque";
import type { Reel } from "../../_hooks/useReels";

const ACCEPTED = "video/mp4,video/webm";
const MAX_BYTES = 200 * 1024 * 1024;

/** Browsers can't reliably play HEVC inside .mov, so block it client-side. */
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

type ReelInsertRow = {
  reel_id: string;
  title: string | null;
  caption: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_sec: number | null;
  is_published: boolean;
  created_at: string;
};

type Props = {
  onUploaded: (reel: Reel) => void;
  onCancel: () => void;
};

export default function ReelUploadForm({ onUploaded, onCancel }: Props) {
  const mosque = useMosque();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mosque.isHQ) {
      toast("HQ preview — sign in as a mosque admin to upload.");
      return;
    }
    if (!file) {
      toast.error("Pick a video file first");
      return;
    }
    const formatError = rejectIfUnsupportedFormat(file);
    if (formatError) {
      toast.error(formatError);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Video must be under 200 MB");
      return;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      toast.error("Supabase URL not configured");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("mosque_id", mosque.id);
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
      const body = (await res.json()) as { reel: ReelInsertRow };
      const row = body.reel;
      onUploaded({
        id: row.reel_id,
        title: row.title,
        caption: row.caption,
        videoUrl: row.video_url,
        thumbnailUrl: row.thumbnail_url,
        durationSec: row.duration_sec,
        isPublished: row.is_published,
        createdAt: row.created_at,
      });
      toast.success("Reel uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label className="text-[12.5px] font-semibold text-[#0A261E]">
          Video file
          <span aria-hidden className="ml-0.5 text-[#B8922A]">
            *
          </span>
        </Label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[9/16] w-full max-w-[180px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#0A261E]/15 bg-[#0A261E]/[0.02] text-center transition-colors hover:border-[#0A261E]/25 hover:bg-[#0A261E]/[0.04] disabled:opacity-60"
        >
          {file ? (
            <>
              <Video size={20} className="text-[#0A261E]/55" />
              <p className="px-2 text-[11.5px] font-medium text-[#0A261E]">
                {file.name.length > 30 ? `${file.name.slice(0, 27)}…` : file.name}
              </p>
              <p className="text-[11px] text-[#0A261E]/55">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </>
          ) : (
            <>
              <Upload size={22} className="text-[#0A261E]/45" />
              <p className="text-[12.5px] font-semibold text-[#0A261E]">
                Pick a video
              </p>
              <p className="px-2 text-[11px] text-[#0A261E]/55">
                MP4 (H.264) or WebM · ≤ 200 MB · 9:16 vertical recommended
              </p>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12.5px] font-semibold text-[#0A261E]">Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Friday reminder"
          disabled={uploading}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[12.5px] font-semibold text-[#0A261E]">Caption</Label>
        <Textarea
          rows={2}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Quick thought from Imam Yusuf"
          disabled={uploading}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploading || !file}>
          {uploading ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload size={13} /> Upload reel
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
