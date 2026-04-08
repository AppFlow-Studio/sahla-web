"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ToastProvider";

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

  return (
    <div className="space-y-6">
      {/* App Name */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="mb-1 block text-[13px] font-semibold text-stone-800">App Name</label>
        <p className="mb-3 text-[12px] text-stone-400">
          Displayed under the app icon. Keep it short — iOS truncates after ~10 characters.
        </p>
        <div className="relative">
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value.slice(0, 10))}
            placeholder="e.g., ICB App"
            className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-stone-400">
            {appName.length}/10
          </span>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="mb-1 block text-[13px] font-semibold text-stone-800">App Logo</label>
        <p className="mb-3 text-[12px] text-stone-400">
          Square image, at least 512x512px. PNG or JPG.
        </p>
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold"
            style={{
              background: logoUrl ? `url(${logoUrl}) center/cover` : `${brandColor}22`,
              color: brandColor,
            }}
          >
            {!logoUrl && displayLetter}
          </div>
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-[12px] font-medium text-stone-700 hover:bg-stone-50">
              {uploading ? "Uploading..." : "Choose File"}
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
                className="ml-2 text-[11px] text-stone-400 hover:text-red-500"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Brand Color */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="mb-1 block text-[13px] font-semibold text-stone-800">Brand Color</label>
        <p className="mb-3 text-[12px] text-stone-400">
          Used for buttons, headers, and accents in the app.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => setBrandColor(color)}
              className="relative h-8 w-8 rounded-full border-2 transition-all"
              style={{
                backgroundColor: color,
                borderColor: brandColor === color ? color : "transparent",
                boxShadow: brandColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none",
              }}
            >
              {brandColor === color && (
                <svg className="absolute inset-0 m-auto h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-stone-500">Custom:</span>
          <input
            type="text"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            placeholder="#0D7C5F"
            className="w-24 rounded-lg border border-stone-300 bg-stone-50 px-2 py-1.5 text-[12px] font-mono text-stone-900 focus:border-emerald-500 focus:outline-none"
          />
          <div
            className="h-6 w-6 rounded-full border border-stone-200"
            style={{ backgroundColor: brandColor }}
          />
        </div>
      </div>

      {/* Live Preview */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="mb-3 block text-[13px] font-semibold text-stone-800">Preview</label>
        <div className="flex gap-6">
          {/* App Icon */}
          <div className="text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md"
              style={{
                background: logoUrl ? `url(${logoUrl}) center/cover` : brandColor,
              }}
            >
              {!logoUrl && displayLetter}
            </div>
            <p className="mt-1.5 text-[10px] text-stone-500">{appName || "App Name"}</p>
          </div>

          {/* Notification Preview */}
          <div className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
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
          disabled={saving}
          className="rounded-lg border border-stone-300 px-5 py-2.5 text-[13px] font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || !appName.trim()}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
}
