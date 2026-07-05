"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HexColorPicker } from "react-colorful";
import { Check, Lock, RotateCcw, Save, Sparkles } from "lucide-react";
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
  const [primary, setPrimary] = useState(mosque.primaryColor);
  const [accent, setAccent] = useState(mosque.accentColor);
  const [fontTheme, setFontTheme] = useState<FontThemeKey>(
    normalizeFontTheme(mosque.fontTheme),
  );
  const [headerStyle, setHeaderStyle] = useState<HeaderStyleKey>(
    normalizeHeaderStyle(mosque.headerStyle),
  );
  const [isSaving, setIsSaving] = useState(false);

  const dirty =
    primary !== mosque.primaryColor ||
    accent !== mosque.accentColor ||
    fontTheme !== normalizeFontTheme(mosque.fontTheme) ||
    headerStyle !== normalizeHeaderStyle(mosque.headerStyle);

  function reset() {
    setPrimary(mosque.primaryColor);
    setAccent(mosque.accentColor);
    setFontTheme(normalizeFontTheme(mosque.fontTheme));
    setHeaderStyle(normalizeHeaderStyle(mosque.headerStyle));
    toast.success("Reverted to current theme");
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
          brand_color: primary,
          accent_color: accent,
          font_theme: fontTheme,
          header_style: headerStyle,
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

          <div className="rounded-2xl border border-dashed border-[#0A261E]/15 bg-[var(--mosque-surface,#fffbf2)]/50 p-4">
            <div className="flex items-start gap-3">
              <Lock size={14} className="mt-0.5 text-[#0A261E]/45" />
              <div>
                <p className="text-[12.5px] font-semibold text-[#0A261E]">
                  Logo and splash screen
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#0A261E]/55">
                  Upload + automatic EAS rebuild trigger ships next release.
                  In the meantime, send your logo to support and we&rsquo;ll
                  wire it in for you.
                </p>
              </div>
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
                appName={mosque.appName || mosque.name}
                brandColor={primary}
                accentColor={accent}
                logoUrl={mosque.logoUrl ?? undefined}
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
            className="h-12 w-12 rounded-xl border border-[#0A261E]/15 transition-shadow hover:shadow-md"
            style={{ background: value }}
            aria-label={`Pick ${label}`}
          />
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
    </section>
  );
}

function hexToRgb(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return "—";
  return `rgb(${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)})`;
}

