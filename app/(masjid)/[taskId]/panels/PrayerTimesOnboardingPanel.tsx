"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, MapPin, Check, CheckCircle2, Loader2 } from "lucide-react";
import {
  CALCULATION_METHODS,
  SCHOOLS,
  PRAYER_NAMES,
  PRAYER_DISPLAY_NAMES,
} from "@/lib/prayer/constants";
import { computeIqamahTime, to12Hour } from "@/lib/prayer/utils";
import { useToast } from "../../components/ToastProvider";
import { Dropdown } from "@/app/(admin)/components/Dropdown";
import { cn } from "@/lib/utils";
import { BTN_PRIMARY, BTN_PRIMARY_DISABLED, BTN_GHOST, CARD } from "@/lib/ui-classes";
import type { PrayerName, IqamahConfig, IqamahMode, TodaysPrayer } from "@/lib/prayer/types";

type WizardStep = "view" | "success" | 1 | 2 | 3 | 4 | 5;

type PreviewTimings = Record<PrayerName, string>;

type IqamahFormRow = {
  prayer_name: PrayerName;
  mode: IqamahMode;
  fixed_time: string;
  offset_minutes: number;
};

type MosqueData = {
  id: string;
  name: string | null;
  address: string | null;
  calculation_method: number | null;
  school: number | null;
};

const DEFAULT_OFFSETS: Record<PrayerName, number> = {
  fajr: 20, dhuhr: 15, asr: 15, maghrib: 5, isha: 15,
};

const STEP_LABELS = ["Address", "Method", "Preview", "Iqamah", "Confirm"];

const IQAMAH_MODE_OPTIONS = [
  { value: "fixed", label: "Fixed Time" },
  { value: "offset", label: "Offset from Athan" },
];

const CALC_METHOD_OPTIONS = CALCULATION_METHODS.map((m) => ({ value: m.value, label: m.label }));
const SCHOOL_OPTIONS = SCHOOLS.map((s) => ({ value: s.value, label: s.label }));

function Stepper({ step }: { step: Exclude<WizardStep, "view"> }) {
  const allDone = step === "success";
  return (
    <div className="mx-auto mb-8 flex max-w-2xl items-start justify-between">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = !allDone && step === stepNum;
        const isDone = allDone || (typeof step === "number" && step > stepNum);
        const isLast = i === STEP_LABELS.length - 1;

        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition-all",
                  isDone && "bg-emerald-500 text-white",
                  isActive && "bg-stone-900 text-white shadow-sm ring-4 ring-stone-100",
                  !isActive && !isDone && "border border-stone-200 bg-stone-50 text-stone-400"
                )}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : stepNum}
              </div>
              <span
                className={cn(
                  "mt-2 whitespace-nowrap text-xs font-medium",
                  isActive && "text-stone-900",
                  isDone && "text-stone-500",
                  !isActive && !isDone && "text-stone-400"
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 mt-4 h-0.5 flex-1 rounded-full transition-colors",
                  isDone ? "bg-emerald-400" : "bg-stone-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PrayerTimesOnboardingPanel({
  mosque,
  existingConfig,
}: {
  mosque: MosqueData;
  existingConfig: IqamahConfig[];
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const isConfigured = existingConfig.length === 5;
  const [step, setStep] = useState<WizardStep>(isConfigured ? "view" : 1);
  const [todaysPrayers, setTodaysPrayers] = useState<TodaysPrayer[] | null>(null);
  const [address, setAddress] = useState(mosque.address || "");
  const [method, setMethod] = useState(mosque.calculation_method ?? 2);
  const [school, setSchool] = useState(mosque.school ?? 0);
  const [previewTimings, setPreviewTimings] = useState<PreviewTimings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [iqamahRows, setIqamahRows] = useState<IqamahFormRow[]>(() => {
    if (existingConfig.length === 5) {
      return PRAYER_NAMES.map((p) => {
        const existing = existingConfig.find((c) => c.prayer_name === p);
        return {
          prayer_name: p,
          mode: existing?.mode || "offset",
          fixed_time: existing?.fixed_time || "12:00",
          offset_minutes: existing?.offset_minutes ?? DEFAULT_OFFSETS[p],
        };
      });
    }
    return PRAYER_NAMES.map((p) => ({
      prayer_name: p,
      mode: "offset" as IqamahMode,
      fixed_time: "12:00",
      offset_minutes: DEFAULT_OFFSETS[p],
    }));
  });

  useEffect(() => {
    if (isConfigured) {
      fetch(`/api/mosques/${mosque.id}/todays-prayers`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.length) {
            const ordered = PRAYER_NAMES.map((p) => data.find((d: TodaysPrayer) => d.prayer_name === p)).filter(Boolean);
            setTodaysPrayers(ordered);
          }
        })
        .catch(() => {});
    }
  }, []);

  async function fetchPreview() {
    if (!address.trim()) {
      showToast("Address is required", "error");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ address, method: String(method), school: String(school) });
      const res = await fetch(`/api/mosques/${mosque.id}/prayer-preview?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPreviewTimings(data.timings);
      setStep(3);
    } catch {
      showToast("Failed to fetch prayer times. Check the address.", "error");
    } finally {
      setLoading(false);
    }
  }

  const finalPreview = useMemo(() => {
    if (!previewTimings) return null;
    const now = new Date();
    const result = {} as Record<PrayerName, { athan: string; iqamah: string }>;
    for (const row of iqamahRows) {
      const athan = previewTimings[row.prayer_name];
      const config: IqamahConfig = {
        mosque_id: mosque.id,
        prayer_name: row.prayer_name,
        mode: row.mode,
        fixed_time: row.mode === "fixed" ? row.fixed_time : null,
        offset_minutes: row.mode === "offset" ? row.offset_minutes : null,
        seasonal_rules: null,
      };
      const iqamah = computeIqamahTime(athan, config, now);
      result[row.prayer_name] = { athan, iqamah: iqamah || athan };
    }
    return result;
  }, [iqamahRows, previewTimings, mosque.id]);

  async function handleSave() {
    setSaving(true);
    try {
      const configs: IqamahConfig[] = iqamahRows.map((row) => ({
        mosque_id: mosque.id,
        prayer_name: row.prayer_name,
        mode: row.mode,
        fixed_time: row.mode === "fixed" ? row.fixed_time : null,
        offset_minutes: row.mode === "offset" ? row.offset_minutes : null,
        seasonal_rules: null,
      }));

      const configRes = await fetch(`/api/mosques/${mosque.id}/iqamah-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs, calculationMethod: method, school, address }),
      });
      if (!configRes.ok) throw new Error("Failed to save config");

      const syncRes = await fetch(`/api/mosques/${mosque.id}/prayer-sync`, { method: "POST" });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.prayers) setTodaysPrayers(syncData.prayers);
      }

      setStep("success");
      router.refresh();
    } catch {
      showToast("Failed to save prayer configuration", "error");
    } finally {
      setSaving(false);
    }
  }

  function updateIqamahRow(index: number, updates: Partial<IqamahFormRow>) {
    setIqamahRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...updates } : row)));
  }

  // ─── Configured View ───
  if (step === "view") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className={CARD}>
          <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-[14px] font-semibold text-stone-900">Prayer Schedule</p>
                <span className="rounded-full bg-stone-100 px-3 py-0.5 text-[11px] font-medium text-stone-500">
                  {CALCULATION_METHODS.find((m) => m.value === method)?.label || "ISNA"} · {SCHOOLS.find((s) => s.value === school)?.label || "Shafi"}
                </span>
              </div>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-500 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-700"
              >
                <Settings size={13} /> Reconfigure
              </button>
            </div>
          </div>
          <div className="px-6 py-5">
            {todaysPrayers ? (
              <div className="overflow-hidden rounded-xl border border-stone-200">
                <div className="flex bg-stone-50 px-4 py-2">
                  <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Prayer</span>
                  <span className="w-24 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-400">Athan</span>
                  <span className="w-24 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-400">Iqamah</span>
                </div>
                {todaysPrayers.map((p, i) => (
                  <div
                    key={p.prayer_name}
                    className="flex items-center px-4 py-2.5"
                    style={{ backgroundColor: i % 2 === 1 ? "rgba(250,250,249,0.6)" : "#ffffff" }}
                  >
                    <span className="flex-1 text-[14px] font-medium text-stone-800">{PRAYER_DISPLAY_NAMES[p.prayer_name]}</span>
                    <span className="w-24 text-right font-mono text-[13px] text-stone-500">{to12Hour(p.athan_time)}</span>
                    <span className="w-24 text-right font-mono text-[13px] font-semibold text-stone-900">{to12Hour(p.iqamah_time)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-10 animate-pulse rounded-lg bg-stone-100" />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Wizard ───
  return (
    <div>
      <Stepper step={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* ─── Step 1: Address ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className={CARD}>
                <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
                  <p className="text-[14px] font-semibold text-stone-900">Mosque Address</p>
                  <p className="mt-0.5 text-[12px] text-stone-500">
                    Used to calculate accurate prayer times.
                  </p>
                </div>
                <div className="px-6 py-5">
                  <div className="relative">
                    <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g., 123 Main St, Brooklyn, NY 11201"
                      className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-4 text-sm text-stone-900 shadow-sm outline-none transition-colors placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => address.trim() ? setStep(2) : showToast("Address is required", "error")}
                  disabled={!address.trim()}
                  className={address.trim() ? BTN_PRIMARY : BTN_PRIMARY_DISABLED}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Method + School ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className={CARD}>
                <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
                  <p className="text-[14px] font-semibold text-stone-900">Calculation Method</p>
                  <p className="mt-0.5 text-[12px] text-stone-500">
                    Most North American mosques use ISNA. This determines Fajr and Isha angles.
                  </p>
                </div>
                <div className="space-y-5 px-6 py-5">
                  <Dropdown
                    value={method}
                    onChange={(v) => setMethod(Number(v))}
                    options={CALC_METHOD_OPTIONS}
                    className="w-full"
                    minWidth={0}
                  />

                  <div>
                    <p className="mb-1 text-[14px] font-semibold text-stone-900">School</p>
                    <p className="mb-3 text-[12px] text-stone-500">
                      Determines Asr calculation.
                    </p>
                    <Dropdown
                      value={school}
                      onChange={(v) => setSchool(Number(v))}
                      options={SCHOOL_OPTIONS}
                      className="w-full"
                      minWidth={0}
                    />
                    <p className="mt-2 text-[11px] text-stone-400">
                      Standard (Shafi) is used by most mosques. Hanafi calculates a later Asr time.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className={BTN_GHOST}>
                  Back
                </button>
                <button onClick={fetchPreview} disabled={loading} className={BTN_PRIMARY}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Fetching..." : "Preview Times"}
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Athan Preview ─── */}
          {step === 3 && previewTimings && (
            <div className="space-y-5">
              <div className={CARD}>
                <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
                  <p className="text-[14px] font-semibold text-stone-900">Today&apos;s Athan Times</p>
                  <p className="mt-0.5 text-[12px] text-stone-500">
                    Do these times look correct for your mosque?
                  </p>
                </div>
                <div className="px-6 py-5">
                  <div className="overflow-hidden rounded-xl border border-stone-200">
                    {PRAYER_NAMES.map((prayer, i) => (
                      <div
                        key={prayer}
                        className="flex items-center px-4 py-2.5"
                        style={{ backgroundColor: i % 2 === 1 ? "rgba(250,250,249,0.6)" : "#ffffff" }}
                      >
                        <Check size={14} className="mr-3 text-teal-500" strokeWidth={3} />
                        <span className="flex-1 text-[14px] font-medium text-stone-800">
                          {PRAYER_DISPLAY_NAMES[prayer]}
                        </span>
                        <span className="font-mono text-[13px] font-semibold text-stone-900">
                          {to12Hour(previewTimings[prayer])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className={BTN_GHOST}>
                  Change Method
                </button>
                <button onClick={() => setStep(4)} className={BTN_PRIMARY}>
                  Looks Good
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Iqamah Configuration ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className={CARD}>
                <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
                  <p className="text-[14px] font-semibold text-stone-900">Iqamah Times</p>
                  <p className="mt-0.5 text-[12px] text-stone-500">
                    Set how each prayer&apos;s congregation time is determined.
                  </p>
                </div>
                <div className="px-6 py-5">
                  <div className="overflow-hidden rounded-xl border border-stone-200">
                    {iqamahRows.map((row, i) => (
                      <div
                        key={row.prayer_name}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ backgroundColor: i % 2 === 1 ? "rgba(250,250,249,0.6)" : "#ffffff" }}
                      >
                        <span className="w-24 text-[14px] font-medium text-stone-800">
                          {PRAYER_DISPLAY_NAMES[row.prayer_name]}
                        </span>
                        <Dropdown
                          value={row.mode}
                          onChange={(v) => updateIqamahRow(i, { mode: v as IqamahMode })}
                          options={IQAMAH_MODE_OPTIONS}
                          size="sm"
                          minWidth={150}
                        />
                        {row.mode === "fixed" && (
                          <input
                            type="time"
                            value={row.fixed_time}
                            onChange={(e) => updateIqamahRow(i, { fixed_time: e.target.value })}
                            className="h-10 rounded-lg border border-stone-200 bg-white px-3 font-mono text-[13px] text-stone-800 shadow-sm outline-none transition-colors hover:border-stone-300 focus:border-stone-400"
                          />
                        )}
                        {row.mode === "offset" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={row.offset_minutes}
                              onChange={(e) => updateIqamahRow(i, { offset_minutes: Number(e.target.value) })}
                              className="h-10 w-20 rounded-lg border border-stone-200 bg-white px-3 text-center font-mono text-[13px] tabular-nums text-stone-800 shadow-sm outline-none transition-colors hover:border-stone-300 focus:border-stone-400"
                            />
                            <span className="text-xs text-stone-400">min after athan</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className={BTN_GHOST}>
                  Back
                </button>
                <button onClick={() => setStep(5)} className={BTN_PRIMARY}>
                  Preview Final Times
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 5: Final Preview + Save ─── */}
          {step === 5 && finalPreview && (
            <div className="space-y-5">
              <div className={CARD}>
                <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
                  <p className="text-[14px] font-semibold text-stone-900">Final Prayer Times</p>
                  <p className="mt-0.5 text-[12px] text-stone-500">
                    This is what your app users will see.
                  </p>
                </div>
                <div className="px-6 py-5">
                  <div className="overflow-hidden rounded-xl border border-stone-200">
                    <div className="flex bg-stone-50 px-4 py-2">
                      <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Prayer</span>
                      <span className="w-24 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-400">Athan</span>
                      <span className="w-24 text-right text-[10px] font-semibold uppercase tracking-wider text-stone-400">Iqamah</span>
                    </div>
                    {PRAYER_NAMES.map((prayer, i) => (
                      <div
                        key={prayer}
                        className="flex items-center px-4 py-2.5"
                        style={{ backgroundColor: i % 2 === 1 ? "rgba(250,250,249,0.6)" : "#ffffff" }}
                      >
                        <Check size={14} className="mr-3 text-teal-500" strokeWidth={3} />
                        <span className="flex-1 text-[14px] font-medium text-stone-800">{PRAYER_DISPLAY_NAMES[prayer]}</span>
                        <span className="w-24 text-right font-mono text-[13px] text-stone-500">{to12Hour(finalPreview[prayer].athan)}</span>
                        <span className="w-24 text-right font-mono text-[13px] font-semibold text-stone-900">{to12Hour(finalPreview[prayer].iqamah)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[11px] text-stone-400">
                    Prayer times will update automatically each day based on your configuration.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(4)} className={BTN_GHOST}>
                  Adjust Iqamah
                </button>
                <button onClick={handleSave} disabled={saving} className={BTN_PRIMARY}>
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Saving..." : "Save & Activate"}
                </button>
              </div>
            </div>
          )}

          {/* ─── Success State ─── */}
          {step === "success" && (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
              >
                <CheckCircle2 size={56} className="text-emerald-500" strokeWidth={2} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="flex flex-col items-center"
              >
                <h3 className="mt-4 text-center text-xl font-semibold text-stone-900">
                  Prayer Times Activated
                </h3>
                <p className="mx-auto mt-1 max-w-md text-center text-sm text-stone-500">
                  Prayer times are now live for {mosque.name || "your mosque"}. They will update automatically each day.
                </p>

                {/* Summary card */}
                {(todaysPrayers || finalPreview) && (
                  <div className="mx-auto mt-6 w-full max-w-lg rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="overflow-hidden rounded-lg border border-stone-100">
                      <div className="flex bg-stone-50 px-3 py-1.5">
                        <span className="flex-1 text-[9px] font-semibold uppercase tracking-wider text-stone-400">Prayer</span>
                        <span className="w-20 text-right text-[9px] font-semibold uppercase tracking-wider text-stone-400">Athan</span>
                        <span className="w-20 text-right text-[9px] font-semibold uppercase tracking-wider text-stone-400">Iqamah</span>
                      </div>
                      {PRAYER_NAMES.map((prayer, i) => {
                        const athan = todaysPrayers?.find((p) => p.prayer_name === prayer)?.athan_time || finalPreview?.[prayer]?.athan || "";
                        const iqamah = todaysPrayers?.find((p) => p.prayer_name === prayer)?.iqamah_time || finalPreview?.[prayer]?.iqamah || "";
                        return (
                          <div
                            key={prayer}
                            className="flex items-center px-3 py-1.5"
                            style={{ backgroundColor: i % 2 === 1 ? "rgba(250,250,249,0.6)" : "#ffffff" }}
                          >
                            <span className="flex-1 text-[12px] font-medium text-stone-800">{PRAYER_DISPLAY_NAMES[prayer]}</span>
                            <span className="w-20 text-right font-mono text-xs text-stone-500">{to12Hour(athan)}</span>
                            <span className="w-20 text-right font-mono text-xs font-semibold text-stone-900">{to12Hour(iqamah)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={() => setStep("view")}
                    className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
                  >
                    View Prayer Schedule
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
