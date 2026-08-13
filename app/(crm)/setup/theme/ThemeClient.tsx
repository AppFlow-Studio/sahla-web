"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HexColorPicker } from "react-colorful";
import {
  AlertCircle,
  Check,
  Loader2,
  Pipette,
  RotateCcw,
  Save,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PageHeader from "../../_components/PageHeader";
import { useMosque } from "../../_lib/mock-mosque";
import FontThemePicker from "@/components/FontThemePicker";
import { normalizeFontTheme, type FontThemeKey } from "@/lib/font-themes";
import HeaderStylePicker from "@/components/HeaderStylePicker";
import { normalizeHeaderStyle, type HeaderStyleKey } from "@/lib/header-styles";
import AppPreviewPanel from "@/components/ui/skiper-ui/AppPreviewPanel";
import { cn } from "@/lib/utils";

const PRESETS = [
  { primary: "#0A261E", accent: "#B8922A", name: "Sahla Original" },
  { primary: "#1A3D2E", accent: "#D4AF37", name: "Forest" },
  { primary: "#0F4A45", accent: "#E8A852", name: "Teal & Honey" },
  { primary: "#3D2645", accent: "#C8956D", name: "Aubergine" },
  { primary: "#1F1B2E", accent: "#9B6B4A", name: "Midnight" },
  { primary: "#27345C", accent: "#D4B062", name: "Royal" },
];

export default function ThemeClient() {
  const mosque = useMosque();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [appName, setAppName] = useState(mosque.appName ?? "");
  const [primary, setPrimary] = useState(mosque.primaryColor);
  const [accent, setAccent] = useState(mosque.accentColor);
  const [fontTheme, setFontTheme] = useState<FontThemeKey>(
    normalizeFontTheme(mosque.fontTheme),
  );
  const [headerStyle, setHeaderStyle] = useState<HeaderStyleKey>(
    normalizeHeaderStyle(mosque.headerStyle),
  );
  const [logoUrl, setLogoUrl] = useState(mosque.logoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const dirty =
    appName !== (mosque.appName ?? "") ||
    primary !== mosque.primaryColor ||
    accent !== mosque.accentColor ||
    fontTheme !== normalizeFontTheme(mosque.fontTheme) ||
    headerStyle !== normalizeHeaderStyle(mosque.headerStyle) ||
    logoUrl !== (mosque.logoUrl ?? "");

  function reset() {
    setAppName(mosque.appName ?? "");
    setPrimary(mosque.primaryColor);
    setAccent(mosque.accentColor);
    setFontTheme(normalizeFontTheme(mosque.fontTheme));
    setHeaderStyle(normalizeHeaderStyle(mosque.headerStyle));
    setLogoUrl(mosque.logoUrl ?? "");
    setLogoError(null);
    toast.success("Reverted to current theme");
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so re-choosing the same file after an error still fires.
    e.target.value = "";
    if (!file) return;

    if (mosque.isHQ) {
      toast("HQ preview — sign in as a mosque admin to upload a logo.");
      return;
    }

    setLogoError(null);
    if (!file.type.startsWith("image/")) {
      setLogoError("That doesn't look like an image. PNG, JPG, or WebP only.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setLogoError(
        `Your logo is ${mb} MB — needs to be under 2 MB. Try compressing it (tinypng.com works well) and upload again.`,
      );
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
      const { url } = (await res.json()) as { url: string };
      // Uploaded to storage — persist to the mosque record on "Apply theme".
      setLogoUrl(url);
      toast.success("Logo uploaded", {
        description: "Click Apply theme to save it to your app.",
      });
    } catch {
      setLogoError("Couldn't upload — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (mosque.isHQ) {
      toast(
        "HQ preview — colors won't persist. Sign in as a mosque admin to save.",
      );
      return;
    }
    if (!dirty) {
      toast("Nothing to save", { description: "Colors are already up to date." });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosque.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: appName.trim() || null,
          brand_color: primary,
          accent_color: accent,
          font_theme: fontTheme,
          header_style: headerStyle,
          logo_url: logoUrl || null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      toast.success("Theme saved", {
        description: `Primary ${primary} · Accent ${accent}`,
      });
      // Refresh the layout's server-fetched mosque profile so the
      // sidebar + every other useMosque() consumer reflects the change.
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["crm"] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't save theme.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Mosque Setup"
        title="Theme"
        description="Pick the colors and font that define your mosque app. Saves when you click Apply."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={reset}
              disabled={isSaving || !dirty}
            >
              <RotateCcw size={13} />
              Reset
            </Button>
            <Button onClick={save} disabled={isSaving || !dirty}>
              <Save size={13} />
              {isSaving ? "Saving…" : "Apply theme"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        {/* Editor */}
        <section className="space-y-5">
          <section className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
            <header className="mb-3">
              <h2 className="text-[13.5px] font-semibold text-[#0A261E]">App name</h2>
              <p className="text-[12px] text-[#0A261E]/55">
                The name shown under your app icon and in the app header. Keep it
                short — iOS truncates the home-screen label after ~10 characters.
              </p>
            </header>
            <div className="relative">
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value.slice(0, 25))}
                placeholder={mosque.name}
                maxLength={25}
                className="pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-[#0A261E]/40">
                {appName.length}/25
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
            <header className="mb-3">
              <h2 className="text-[13.5px] font-semibold text-[#0A261E]">Logo</h2>
              <p className="text-[12px] text-[#0A261E]/55">
                Square image, at least 512×512&nbsp;px. Shown on your app&apos;s
                home screen and across the dashboard. PNG, JPG, or WebP · max 2&nbsp;MB.
              </p>
            </header>

            {/* Persistent inline error — harder to miss than a 3-second toast. */}
            {logoError && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
                <div className="flex-1 text-[12.5px] text-red-700">{logoError}</div>
                <button
                  type="button"
                  onClick={() => setLogoError(null)}
                  className="shrink-0 rounded-md p-0.5 text-red-500 transition-colors hover:bg-red-100"
                  aria-label="Dismiss error"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold shadow-sm ring-2 ring-white"
                  style={{
                    background:
                      logoUrl && !uploading
                        ? `url(${logoUrl}) center/cover`
                        : `${primary}1f`,
                    color: primary,
                  }}
                >
                  {!logoUrl && !uploading && mosque.logoInitials}
                </div>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl bg-[#0A261E]/10">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <Loader2 size={18} className="relative z-10 animate-spin text-[#0A261E]" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#0A261E]/12 bg-white px-4 py-2 text-[13px] font-medium text-[#0A261E] shadow-sm transition-colors hover:bg-[#0A261E]/[0.03]",
                    uploading && "cursor-not-allowed opacity-60",
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#0A261E]/60" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={14} className="text-[#0A261E]/50" />
                      {logoUrl ? "Replace" : "Choose file"}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {logoUrl && !uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl("");
                      setLogoError(null);
                    }}
                    className="rounded-lg p-2 text-[#0A261E]/40 transition-colors hover:bg-[#0A261E]/[0.03] hover:text-red-500"
                    aria-label="Remove logo"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>

          <ColorEditor
            label="Primary color"
            description="Used for the navigation, primary buttons, and headings in your app."
            value={primary}
            onChange={setPrimary}
          />
          <ColorEditor
            label="Accent color"
            description="Used for highlights, badges, and call-to-action emphasis."
            value={accent}
            onChange={setAccent}
          />

          <section className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
            <header className="mb-3">
              <h2 className="text-[13.5px] font-semibold text-[#0A261E]">Font</h2>
              <p className="text-[12px] text-[#0A261E]/55">
                The typeface for headings and text across your app. Arabic and
                Qur&apos;an text always use their dedicated font.
              </p>
            </header>
            <FontThemePicker value={fontTheme} onChange={setFontTheme} />
          </section>

          <section className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
            <header className="mb-3">
              <h2 className="text-[13.5px] font-semibold text-[#0A261E]">Home header</h2>
              <p className="text-[12px] text-[#0A261E]/55">
                The top of your app&apos;s home screen — a classic greeting + clock,
                or a live countdown to the next prayer.
              </p>
            </header>
            <HeaderStylePicker value={headerStyle} onChange={setHeaderStyle} />
          </section>

          <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--mosque-accent,#B8922A)]" />
                <h3 className="text-[13px] font-semibold text-[#0A261E]">
                  Curated presets
                </h3>
              </div>
            </header>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => {
                const active =
                  preset.primary === primary && preset.accent === accent;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setPrimary(preset.primary);
                      setAccent(preset.accent);
                    }}
                    className={cn(
                      "group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                      active
                        ? "border-[#0A261E] shadow-[0_0_0_2px_rgba(10,38,30,0.08)]"
                        : "border-[#0A261E]/8 hover:border-[#0A261E]/25"
                    )}
                  >
                    <div className="relative flex w-full items-center gap-1">
                      <div
                        className="h-10 flex-1 rounded-l-md"
                        style={{ background: preset.primary }}
                      />
                      <div
                        className="h-10 flex-1 rounded-r-md"
                        style={{ background: preset.accent }}
                      />
                      {active ? (
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0A261E] text-white">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      ) : null}
                    </div>
                    <p className="text-[10.5px] font-medium text-[#0A261E]/65 group-hover:text-[#0A261E]">
                      {preset.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

        </section>

        {/* Live preview — the real app-home mockup, themed live */}
        <aside>
          <div className="sticky top-24 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
              Live preview
            </p>
            <div className="flex justify-center">
              <AppPreviewPanel
                appName={appName || mosque.name}
                brandColor={primary}
                accentColor={accent}
                logoUrl={logoUrl || undefined}
                fontTheme={fontTheme}
                headerStyle={headerStyle}
                homeOnly
              />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function ColorEditor({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
      <header className="mb-3">
        <h2 className="text-[13.5px] font-semibold text-[#0A261E]">{label}</h2>
        <p className="text-[12px] text-[#0A261E]/55">{description}</p>
      </header>
      <div className="flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className="group relative h-12 w-12 shrink-0 cursor-pointer rounded-xl border border-[#0A261E]/15 shadow-sm transition-all hover:scale-[1.03] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A261E]/30"
            style={{ background: value }}
            aria-label={`Click to pick ${label}`}
            title={`Click to change ${label.toLowerCase()}`}
          >
            {/* Persistent pipette badge so it's obvious the swatch opens a picker */}
            <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#0A261E]/10 bg-white text-[#0A261E] shadow-sm transition-transform group-hover:scale-110">
              <Pipette size={11} />
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <HexColorPicker color={value} onChange={onChange} />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-3 h-8 font-mono text-[12px] uppercase"
              maxLength={7}
            />
          </PopoverContent>
        </Popover>
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono uppercase"
            maxLength={7}
          />
          <p className="mt-1 text-[11px] text-[#0A261E]/45">
            {hexToRgb(value)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0A261E]/50 transition-colors hover:text-[#0A261E]/75"
      >
        <Pipette size={11} />
        Click the swatch to open the color picker, or type a hex code.
      </button>
    </section>
  );
}

function hexToRgb(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return "—";
  return `rgb(${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)})`;
}

