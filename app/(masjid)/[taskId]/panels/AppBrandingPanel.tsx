"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { usePreview } from "../../components/OnboardingPreviewContext";
import ColorPicker from "../../components/ColorPicker";
import FontThemePicker from "@/components/FontThemePicker";
import { normalizeFontTheme, type FontThemeKey } from "@/lib/font-themes";
import HeaderStylePicker from "@/components/HeaderStylePicker";
import { normalizeHeaderStyle, type HeaderStyleKey } from "@/lib/header-styles";
import { cn } from "@/lib/utils";
import { INPUT_CLASS, BTN_PRIMARY, BTN_PRIMARY_DISABLED, BTN_GHOST } from "@/lib/ui-classes";

const PRESET_BRAND_COLORS = [
  "#0A261E", "#0D3B3B", "#1B3A4B", "#1F3C5C", "#2D4A22",
  "#1A3328", "#14332B", "#2C1810", "#3B1F2B", "#1A1A2E",
  "#2E1A47", "#4A3728", "#1C1C1C", "#2A2D34", "#3D2B1F",
  "#0B1D33", "#23395D", "#1B4D3E", "#2F4538", "#3C2415",
  "#4B0082", "#191970", "#2F2F2F", "#3B3B3B", "#004D40",
  "#1A237E", "#311B92", "#BF360C", "#880E4F", "#01579B",
];

const PRESET_ACCENT_COLORS = [
  "#B8922A", "#D4AF37", "#DAA520", "#C8A951", "#A67B2E",
  "#E2C275", "#C9B06B", "#8B7536", "#AA8C2C", "#76622E",
  "#FFFFFF", "#F5F0E1", "#E8DCC8", "#D4C9B0", "#C2B59B",
  "#C0392B", "#E74C3C", "#D35400", "#E67E22", "#F39C12",
  "#27AE60", "#2ECC71", "#1ABC9C", "#16A085", "#2980B9",
  "#3498DB", "#8E44AD", "#9B59B6", "#E91E63", "#FF6B6B",
];

type MosqueData = {
  id: string;
  app_name: string | null;
  logo_url: string | null;
  brand_color: string | null;
  accent_color: string | null;
  font_theme: string | null;
  header_style: string | null;
  name: string | null;
};

export default function AppBrandingPanel({ mosque }: { mosque: MosqueData }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { updatePreview } = usePreview();
  const [saving, setSaving] = useState(false);

  const [appName, setAppName] = useState(mosque.app_name || "");
  const [brandColor, setBrandColor] = useState(mosque.brand_color || "#0A261E");
  const [accentColor, setAccentColor] = useState(mosque.accent_color || "#B8922A");
  const [fontTheme, setFontTheme] = useState<FontThemeKey>(normalizeFontTheme(mosque.font_theme));
  const [headerStyle, setHeaderStyle] = useState<HeaderStyleKey>(normalizeHeaderStyle(mosque.header_style));
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
      updatePreview({ logoUrl: url });
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
          accent_color: accentColor,
          font_theme: fontTheme,
          header_style: headerStyle,
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
              onChange={(e) => { const v = e.target.value.slice(0, 10); setAppName(v); updatePreview({ appName: v }); }}
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
            Square image, at least 512x512px. PNG or JPG.
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
                onClick={() => { setLogoUrl(""); updatePreview({ logoUrl: null }); }}
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
            The primary color used for headers, buttons, and backgrounds in the app.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-6">
            <ColorPicker
              value={brandColor}
              onChange={(c) => { setBrandColor(c); updatePreview({ brandColor: c }); }}
              placeholder="#0A261E"
            />
            <div className="flex-1 min-w-[160px]">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Presets
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_BRAND_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setBrandColor(c); updatePreview({ brandColor: c }); }}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: brandColor === c ? "white" : "transparent",
                      boxShadow: brandColor === c ? `0 0 0 2px ${c}` : "0 0 0 1px rgba(0,0,0,0.08)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">Accent Color</p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            Used for highlights, active states, and decorative elements.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap gap-6">
            <ColorPicker
              value={accentColor}
              onChange={(c) => { setAccentColor(c); updatePreview({ accentColor: c }); }}
              placeholder="#B8922A"
            />
            <div className="flex-1 min-w-[160px]">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Presets
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setAccentColor(c); updatePreview({ accentColor: c }); }}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: accentColor === c ? "white" : "transparent",
                      boxShadow: accentColor === c ? `0 0 0 2px ${c}` : "0 0 0 1px rgba(0,0,0,0.08)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Font Theme */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">Font</p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            The typeface used for headings and text throughout the app. Arabic
            and Qur&apos;an text always use their dedicated font.
          </p>
        </div>
        <div className="px-6 py-5">
          <FontThemePicker value={fontTheme} onChange={setFontTheme} />
        </div>
      </div>

      {/* Home Header */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">Home Header</p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            The top of the app&apos;s home screen — a classic greeting + clock, or
            a live countdown to the next prayer.
          </p>
        </div>
        <div className="px-6 py-5">
          <HeaderStylePicker value={headerStyle} onChange={setHeaderStyle} />
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
