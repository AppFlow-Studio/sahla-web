"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  Compass,
  Eye,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "../../_components/PageHeader";
import HelpButton from "../../_components/HelpButton";
import { useMosque } from "../../_lib/mock-mosque";
import { useIqamahConfig } from "../../_hooks/useIqamahConfig";
import {
  calcMethodToNumber,
  calcMethodFromNumber,
  schoolToNumber,
  schoolFromNumber,
} from "./_lib/calcMethodMap";
import type { IqamahConfig as DbIqamahConfig, PrayerName } from "@/lib/prayer/types";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const PRAYERS = [
  { id: "fajr", label: "Fajr", icon: Sunrise, athan: "04:42" },
  { id: "dhuhr", label: "Dhuhr", icon: Sun, athan: "12:54" },
  { id: "asr", label: "Asr", icon: CloudSun, athan: "16:32" },
  { id: "maghrib", label: "Maghrib", icon: Sunset, athan: "19:48" },
  { id: "isha", label: "Isha", icon: Moon, athan: "21:18" },
] as const;

type PrayerId = (typeof PRAYERS)[number]["id"];
type IqamahMode = "fixed" | "offset" | "seasonal";

type IqamahConfig = {
  mode: IqamahMode;
  /** When mode is fixed */
  fixedTime?: string;
  /** When mode is offset (minutes after athan) */
  offsetMin?: number;
};

const CALCULATION_METHODS = [
  { id: "MWL", label: "Muslim World League" },
  { id: "ISNA", label: "Islamic Society of North America" },
  { id: "EGYPT", label: "Egyptian General Authority" },
  { id: "KARACHI", label: "University of Islamic Sciences, Karachi" },
  { id: "UMM_AL_QURA", label: "Umm al-Qura, Makkah" },
  { id: "GULF", label: "Gulf Region" },
  { id: "TEHRAN", label: "Tehran (Jafari)" },
  { id: "SINGAPORE", label: "Singapore" },
];

const SCHOOLS = [
  { id: "shafi", label: "Shafi (standard)" },
  { id: "hanafi", label: "Hanafi (Asr later)" },
];

const DEFAULT_CONFIG: Record<PrayerId, IqamahConfig> = {
  fajr: { mode: "offset", offsetMin: 20 },
  dhuhr: { mode: "fixed", fixedTime: "13:15" },
  asr: { mode: "offset", offsetMin: 15 },
  maghrib: { mode: "offset", offsetMin: 5 },
  isha: { mode: "fixed", fixedTime: "21:30" },
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const next = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(next / 60);
  const nm = next % 60;
  return `${nh.toString().padStart(2, "0")}:${nm.toString().padStart(2, "0")}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, "0")} ${period}`;
}

function computeIqamah(athan: string, config: IqamahConfig): string {
  if (config.mode === "fixed" && config.fixedTime) return config.fixedTime;
  if (config.mode === "offset") return addMinutes(athan, config.offsetMin ?? 0);
  // Seasonal — pretend we computed it. For demo, just use athan + 25 min.
  return addMinutes(athan, 25);
}

/** Translate a DB iqamah row → local UI state shape. */
function fromDbConfig(rows: DbIqamahConfig[]): Record<PrayerId, IqamahConfig> {
  const map: Record<PrayerId, IqamahConfig> = { ...DEFAULT_CONFIG };
  for (const row of rows) {
    const id = row.prayer_name as PrayerId;
    if (row.mode === "fixed") {
      map[id] = { mode: "fixed", fixedTime: row.fixed_time ?? "13:15" };
    } else if (row.mode === "offset") {
      map[id] = { mode: "offset", offsetMin: row.offset_minutes ?? 15 };
    } else {
      map[id] = { mode: "seasonal" };
    }
  }
  return map;
}

/** Translate UI state → DB rows ready to POST. */
function toDbConfigs(state: Record<PrayerId, IqamahConfig>): DbIqamahConfig[] {
  return (Object.keys(state) as PrayerId[]).map<DbIqamahConfig>((id) => {
    const c = state[id];
    return {
      mosque_id: "", // filled in by the server using requireCrmAccess
      prayer_name: id as PrayerName,
      mode: c.mode,
      fixed_time: c.mode === "fixed" ? c.fixedTime ?? null : null,
      offset_minutes: c.mode === "offset" ? c.offsetMin ?? 0 : null,
      seasonal_rules: null,
    };
  });
}

export default function PrayerTimesClient() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const { data: serverConfig, isLoading } = useIqamahConfig();

  const [calcMethod, setCalcMethod] = useState("ISNA");
  const [school, setSchool] = useState("shafi");
  const [config, setConfig] = useState<Record<PrayerId, IqamahConfig>>(DEFAULT_CONFIG);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Hydrate UI state once the server config arrives.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (isLoading) return;
    setCalcMethod(calcMethodFromNumber(serverConfig.calculation_method));
    setSchool(schoolFromNumber(serverConfig.school));
    if (serverConfig.iqamah.length > 0) {
      setConfig(fromDbConfig(serverConfig.iqamah));
    }
    hydratedRef.current = true;
  }, [serverConfig, isLoading]);

  // Debounced persist — fires 600ms after the last edit. Saves the full
  // (calc method, school, iqamah) bundle to match the endpoint contract.
  const pendingRef = useRef<number | null>(null);
  const persist = useCallback(
    (nextMethod: string, nextSchool: string, nextConfig: Record<PrayerId, IqamahConfig>) => {
      if (pendingRef.current) window.clearTimeout(pendingRef.current);
      pendingRef.current = window.setTimeout(async () => {
        if (mosque.isHQ) {
          // HQ preview — local state changes, no persistence.
          setSavedAt(new Date());
          return;
        }
        try {
          const res = await fetch("/api/crm/prayer-times", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              calculation_method: calcMethodToNumber(nextMethod),
              school: schoolToNumber(nextSchool),
              iqamah: toDbConfigs(nextConfig),
            }),
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? `Save failed (${res.status})`);
          }
          setSavedAt(new Date());
          queryClient.invalidateQueries({ queryKey: ["crm", "prayer-times"] });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Couldn't save.";
          toast.error(message);
        }
      }, 600);
    },
    [mosque.isHQ, queryClient]
  );

  // Auto-save flash indicator
  useEffect(() => {
    if (!savedAt) return;
    setSavedFlash(true);
    const t = setTimeout(() => setSavedFlash(false), 1500);
    return () => clearTimeout(t);
  }, [savedAt]);

  function bumpSaved(message: string) {
    toast.success(message);
  }

  function updateMode(id: PrayerId, mode: IqamahMode) {
    setConfig((prev) => {
      const current = prev[id];
      const next: IqamahConfig = { mode };
      if (mode === "fixed") next.fixedTime = current.fixedTime ?? "13:15";
      if (mode === "offset") next.offsetMin = current.offsetMin ?? 15;
      const out = { ...prev, [id]: next };
      persist(calcMethod, school, out);
      return out;
    });
    bumpSaved("Iqamah mode updated");
  }

  function updateFixed(id: PrayerId, fixedTime: string) {
    setConfig((prev) => {
      const out = { ...prev, [id]: { ...prev[id], fixedTime } };
      persist(calcMethod, school, out);
      return out;
    });
  }

  function updateOffset(id: PrayerId, offsetMin: number) {
    setConfig((prev) => {
      const out = {
        ...prev,
        [id]: { ...prev[id], offsetMin: Number.isNaN(offsetMin) ? 0 : offsetMin },
      };
      persist(calcMethod, school, out);
      return out;
    });
  }

  const previewRows = useMemo(
    () =>
      PRAYERS.map((p) => ({
        id: p.id,
        label: p.label,
        icon: p.icon,
        athan: p.athan,
        iqamah: computeIqamah(p.athan, config[p.id]),
      })),
    [config]
  );

  return (
    <>
      <PageHeader
        eyebrow="Mosque Setup"
        title="Prayer Times"
        description="Calculation method, school, and iqamah configuration. Saves as you edit."
        action={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[12px] font-medium transition-colors",
              savedFlash
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-[#0A261E]/8 text-[#0A261E]/55"
            )}
          >
            <Save size={12} />
            {savedFlash
              ? "Saved"
              : savedAt
              ? `Saved ${savedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
              : "Auto-save on"}
          </span>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Left: configuration */}
        <section className="space-y-5">
          <ConfigCard
            title="Calculation method"
            description="Determines when each prayer's athan time is calculated for your location."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Method" helpText="If unsure, ISNA is a safe default for North America.">
                <Select
                  value={calcMethod}
                  onValueChange={(v) => {
                    const next = v ?? "ISNA";
                    setCalcMethod(next);
                    persist(next, school, config);
                    bumpSaved("Calculation method updated");
                  }}
                >
                  <SelectTrigger>
                    <Compass size={13} className="text-[#0A261E]/45" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALCULATION_METHODS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Asr school" helpText="Hanafi schools wait until shadow length doubles.">
                <Select
                  value={school}
                  onValueChange={(v) => {
                    const next = v ?? "shafi";
                    setSchool(next);
                    persist(calcMethod, next, config);
                    bumpSaved("Asr school updated");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOLS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </ConfigCard>

          <ConfigCard
            title="Iqamah settings"
            description="Iqamah is the call-to-line — the gap between athan and prayer. Set per prayer."
          >
            <ul className="space-y-2.5">
              {PRAYERS.map((p) => {
                const c = config[p.id];
                const Icon = p.icon;
                return (
                  <li
                    key={p.id}
                    className="rounded-xl border border-[#0A261E]/8 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                      <div className="flex min-w-[120px] items-center gap-2.5">
                        <Icon size={16} className="text-[#B8922A]" strokeWidth={1.6} />
                        <div>
                          <p className="text-[13.5px] font-semibold text-[#0A261E]">
                            {p.label}
                          </p>
                          <p className="text-[11px] text-[#0A261E]/50">
                            Athan {formatTime(p.athan)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 items-center gap-1 rounded-lg bg-[#fffbf2] p-0.5">
                        {(["offset", "fixed", "seasonal"] as IqamahMode[]).map(
                          (mode) => {
                            const active = c.mode === mode;
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => updateMode(p.id, mode)}
                                className={cn(
                                  "flex-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors",
                                  active
                                    ? "bg-white text-[#0A261E] shadow-sm"
                                    : "text-[#0A261E]/55 hover:text-[#0A261E]"
                                )}
                              >
                                {mode}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <div className="md:w-[180px]">
                        <AnimatePresence mode="wait">
                          {c.mode === "fixed" ? (
                            <motion.div
                              key="fixed"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Input
                                type="time"
                                value={c.fixedTime ?? ""}
                                onChange={(e) => updateFixed(p.id, e.target.value)}
                                onBlur={() => bumpSaved(`${p.label} iqamah saved`)}
                              />
                            </motion.div>
                          ) : c.mode === "offset" ? (
                            <motion.div
                              key="offset"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  max={120}
                                  value={c.offsetMin ?? 0}
                                  onChange={(e) =>
                                    updateOffset(p.id, parseInt(e.target.value, 10))
                                  }
                                  onBlur={() =>
                                    bumpSaved(`${p.label} iqamah saved`)
                                  }
                                  className="pr-12"
                                />
                                <span
                                  aria-hidden
                                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#0A261E]/45"
                                >
                                  +min
                                </span>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="seasonal"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                            >
                              <p className="rounded-md border border-dashed border-[#0A261E]/15 bg-[#fffbf2] px-3 py-1.5 text-[11.5px] text-[#0A261E]/55">
                                Auto by solar declination
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ConfigCard>
        </section>

        {/* Right: live preview */}
        <aside>
          <div className="sticky top-24 rounded-2xl border border-[#0A261E]/8 bg-[#0A261E] text-[#fffbf2]">
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#fffbf2]/55">
                  Live preview
                </p>
                <p className="font-display text-[16px] text-[#E8D5B0]">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Eye size={16} className="text-[#B8922A]" />
            </header>
            <ul className="divide-y divide-white/[0.06] px-1 py-2">
              {previewRows.map((row) => {
                const Icon = row.icon;
                return (
                  <li
                    key={row.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#B8922A]">
                      <Icon size={15} strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#fffbf2]">
                        {row.label}
                      </p>
                      <p className="text-[10.5px] text-[#fffbf2]/55">
                        Athan {formatTime(row.athan)}
                      </p>
                    </div>
                    <p className="font-display text-[18px] tabular-nums text-[#E8D5B0]">
                      {formatTime(row.iqamah)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <footer className="border-t border-white/[0.06] px-5 py-3 text-center">
              <p className="text-[10.5px] text-[#fffbf2]/45">
                This is what your members see in the app
              </p>
            </footer>
          </div>
        </aside>
      </div>
    </>
  );
}

function ConfigCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 md:p-6">
      <header className="mb-4">
        <h2 className="text-[14px] font-semibold text-[#0A261E]">{title}</h2>
        <p className="text-[12.5px] text-[#0A261E]/55">{description}</p>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  helpText,
  children,
}: {
  label: string;
  helpText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-[12.5px] font-semibold text-[#0A261E]">
          {label}
        </label>
        {helpText ? <HelpButton text={helpText} /> : null}
      </div>
      {children}
    </div>
  );
}
