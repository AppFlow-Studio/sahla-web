"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
                <Sparkles size={14} className="text-[#B8922A]" />
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

          <div className="rounded-2xl border border-dashed border-[#0A261E]/15 bg-[#fffbf2]/50 p-4">
            <div className="flex items-start gap-3">
              <Lock size={14} className="mt-0.5 text-[#0A261E]/45" />
              <div>
                <p className="text-[12.5px] font-semibold text-[#0A261E]">
                  Logo and splash screen
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#0A261E]/55">
                  Upload + automatic EAS rebuild trigger ships next release.
                  In the meantime, send your logo to support and we'll wire
                  it in for you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live preview */}
        <aside>
          <div className="sticky top-24 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
              Live preview
            </p>
            <AppPreview
              primary={primary}
              accent={accent}
              mosqueName={mosque.name}
              initials={mosque.logoInitials}
            />
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

/* ─── App preview — a small mockup of the mosque app's home tab ─── */

function AppPreview({
  primary,
  accent,
  mosqueName,
  initials,
}: {
  primary: string;
  accent: string;
  mosqueName: string;
  initials: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-[36px] border border-[#0A261E]/12 bg-[#0A261E] p-2 shadow-[0_18px_40px_-20px_rgba(10,38,30,0.35)]"
    >
      <div
        className="rounded-[28px] p-5"
        style={{
          background: `linear-gradient(180deg, ${primary} 0%, ${darken(primary, 8)} 100%)`,
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between text-[10px] text-white/55">
          <span>9:41</span>
          <span>•••</span>
        </div>

        {/* Header */}
        <div className="mt-5 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[14px] font-display"
            style={{ background: accent, color: primary }}
          >
            {initials}
          </div>
          <div>
            <p
              className="font-display text-[18px] leading-tight"
              style={{ color: tintBg(primary) }}
            >
              {mosqueName}
            </p>
            <p className="text-[10.5px] text-white/55">Home</p>
          </div>
        </div>

        {/* Next prayer card */}
        <div
          className="mt-5 rounded-2xl p-4"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid rgba(255,255,255,0.08)`,
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
            Up next
          </p>
          <p className="mt-1 font-display text-[20px] text-white">Maghrib</p>
          <p className="text-[12px] text-white/65">In 1h 24m · 7:48 PM</p>
        </div>

        {/* Quick actions */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Donate", "Programs", "Members"].map((label, i) => (
            <button
              key={label}
              type="button"
              className="rounded-xl px-2 py-2.5 text-center text-[11px] font-medium text-white"
              style={{
                background: i === 0 ? accent : "rgba(255,255,255,0.06)",
                color: i === 0 ? primary : "rgba(255,255,255,0.85)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Today's program */}
        <div className="mt-3 rounded-2xl bg-white/[0.04] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Tonight
          </p>
          <p className="mt-1 text-[12.5px] font-semibold text-white">
            Friday Halaqa
          </p>
          <p className="text-[11px] text-white/55">Sheikh Omar · 8:00 PM</p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: accent, color: primary }}
          >
            RSVP
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function tintBg(hex: string): string {
  // Pick a warm cream-ish tint for headers when on dark backgrounds.
  return "#E8D5B0";
}

function darken(hex: string, amount: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = Math.max(0, parseInt(m[1], 16) - amount);
  const g = Math.max(0, parseInt(m[2], 16) - amount);
  const b = Math.max(0, parseInt(m[3], 16) - amount);
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
