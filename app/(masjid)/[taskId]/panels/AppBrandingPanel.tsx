"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Upload, X } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { cn } from "@/lib/utils";
import { INPUT_CLASS, BTN_PRIMARY, BTN_PRIMARY_DISABLED, BTN_GHOST } from "@/lib/ui-classes";

const COLOR_PRESETS = [
  "#0D7C5F", "#10B981", "#3B82F6", "#6366F1",
  "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
  "#06B6D4", "#14B8A6",
];

type MosqueData = {
  id: string;
  app_name: string | null;
  logo_url: string | null;
  brand_color: string | null;
  name: string | null;
};

export default function AppBrandingPanel({ mosque }: { mosque: MosqueData }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [appName, setAppName] = useState(mosque.app_name || "");
  const [brandColor, setBrandColor] = useState(mosque.brand_color || "#0D7C5F");
  const [logoUrl, setLogoUrl] = useState(mosque.logo_url || "");
  const [uploading, setUploading] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo must be under 2MB", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/mosques/${mosque.id}/logo`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setLogoUrl(url);
      showToast("Logo uploaded", "success");
    } catch {
      showToast("Failed to upload logo", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(markComplete = false) {
    if (!appName.trim()) {
      showToast("App name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosque.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: appName,
          brand_color: brandColor,
          logo_url: logoUrl || null,
          ...(markComplete ? { markComplete: "app_branding" } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast(markComplete ? "Branding completed" : "Branding saved", "success");
      router.refresh();
    } catch {
      showToast("Failed to save branding", "error");
    } finally {
      setSaving(false);
    }
  }

  const displayLetter = mosque.name?.charAt(0).toUpperCase() || "M";
  const canComplete = appName.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* App Name */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">App Name</p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            Displayed under the app icon. Keep it short — iOS truncates after ~10 characters.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="relative">
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value.slice(0, 10))}
              placeholder="e.g., ICB App"
              className={cn(INPUT_CLASS, "pr-14")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-stone-400">
              {appName.length}/10
            </span>
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">App Logo</p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            Square image, at least 512×512px. PNG or JPG.
          </p>
        </div>
        <div className="flex items-center gap-5 px-6 py-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold shadow-sm ring-2 ring-white"
            style={{
              background: logoUrl ? `url(${logoUrl}) center/cover` : `${brandColor}1f`,
              color: brandColor,
            }}
          >
            {!logoUrl && displayLetter}
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-[13px] font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50">
              <Upload size={14} className="text-stone-400" />
              {uploading ? "Uploading..." : logoUrl ? "Replace" : "Choose File"}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {logoUrl && (
              <button
                onClick={() => setLogoUrl("")}
                className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-50 hover:text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Brand Color */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">Brand Color</p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            Used for buttons, headers, and accents in the app.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="mb-4 flex flex-wrap gap-2.5">
            {COLOR_PRESETS.map((color) => {
              const isSelected = brandColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setBrandColor(color)}
                  className="relative h-9 w-9 rounded-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: color }}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check size={16} className="text-white drop-shadow-sm" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-stone-500">Custom:</span>
            <input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#0D7C5F"
              className="h-9 w-28 rounded-lg border border-stone-200 bg-white px-3 font-mono text-[12px] text-stone-900 shadow-sm outline-none transition-colors hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
            />
            <div
              className="h-9 w-9 rounded-lg border border-stone-200"
              style={{ backgroundColor: brandColor }}
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">Preview</p>
        </div>
        <div className="flex gap-6 px-6 py-5">
          <div className="text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-md"
              style={{ background: logoUrl ? `url(${logoUrl}) center/cover` : brandColor }}
            >
              {!logoUrl && displayLetter}
            </div>
            <p className="mt-2 text-[11px] text-stone-500">{appName || "App Name"}</p>
          </div>

          <div className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {displayLetter}
              </div>
              <span className="text-[11px] font-medium text-stone-700">
                {appName || "Your App"}
              </span>
              <span className="ml-auto text-[10px] text-stone-400">now</span>
            </div>
            <p className="mt-1 text-[12px] text-stone-600">
              Iqamah for Maghrib in 10 minutes
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleSave(false)}
          disabled={saving || !canComplete}
          className={BTN_GHOST}
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || !canComplete}
          className={canComplete && !saving ? BTN_PRIMARY : BTN_PRIMARY_DISABLED}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Mark Complete
        </button>
      </div>
    </div>
  );
}
