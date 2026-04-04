"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CALCULATION_METHODS,
  SCHOOLS,
  PRAYER_NAMES,
  PRAYER_DISPLAY_NAMES,
} from "@/lib/prayer/constants";
import { computeIqamahTime, to12Hour } from "@/lib/prayer/utils";
import type { PrayerName, IqamahConfig, IqamahMode, TodaysPrayer } from "@/lib/prayer/types";

type Step = "view" | 1 | 2 | 3 | 4 | 5;

type PreviewTimings = Record<PrayerName, string>;

type IqamahFormRow = {
  prayer_name: PrayerName;
  mode: IqamahMode;
  fixed_time: string;
  offset_minutes: number;
};

const STEP_LABELS = [
  "Address",
  "Method",
  "Preview",
  "Iqamah",
  "Confirm",
];

export default function PrayerTimesPanel({
  mosque,
  existingConfig,
  showToast,
}: {
  mosque: { id: string; address: string | null; calculation_method: number | null; school: number | null };
  existingConfig: IqamahConfig[];
  showToast: (message: string, type: "success" | "error") => void;
}) {
  const isConfigured = existingConfig.length === 5;
  const [step, setStep] = useState<Step>(isConfigured ? "view" : 1);
  const [todaysPrayers, setTodaysPrayers] = useState<TodaysPrayer[] | null>(null);
  const [address, setAddress] = useState(mosque.address || "");
  const [method, setMethod] = useState(mosque.calculation_method ?? 2);
  const [school, setSchool] = useState(mosque.school ?? 0);
  const [previewTimings, setPreviewTimings] = useState<PreviewTimings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const [iqamahRows, setIqamahRows] = useState<IqamahFormRow[]>(() => {
    if (existingConfig.length === 5) {
      return PRAYER_NAMES.map((p) => {
        const existing = existingConfig.find((c) => c.prayer_name === p);
        return {
          prayer_name: p,
          mode: existing?.mode || "offset",
          fixed_time: existing?.fixed_time || "12:00",
          offset_minutes: existing?.offset_minutes ?? 15,
        };
      });
    }
    const defaultOffsets: Record<PrayerName, number> = {
      fajr: 20, dhuhr: 15, asr: 15, maghrib: 5, isha: 15,
    };
    return PRAYER_NAMES.map((p) => ({
      prayer_name: p,
      mode: "offset" as IqamahMode,
      fixed_time: "12:00",
      offset_minutes: defaultOffsets[p],
    }));
  });

  async function fetchPreview() {
    if (!address.trim()) {
      showToast("Address is required", "error");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        address,
        method: String(method),
        school: String(school),
      });
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

      // Trigger sync and get computed times
      const syncRes = await fetch(`/api/mosques/${mosque.id}/prayer-sync`, { method: "POST" });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.prayers) setTodaysPrayers(syncData.prayers);
      }

      showToast("Prayer times saved and synced", "success");
      setStep("view");
    } catch {
      showToast("Failed to save prayer configuration", "error");
    } finally {
      setSaving(false);
    }
  }

  function updateIqamahRow(index: number, updates: Partial<IqamahFormRow>) {
    setIqamahRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
    );
  }

  return (
    <div>
      {/* Configured View */}
      {step === "view" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-lg border border-edge bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Prayer Schedule</p>
                <p className="text-[12px] text-subtle">
                  {CALCULATION_METHODS.find((m) => m.value === method)?.label || "ISNA"} · {SCHOOLS.find((s) => s.value === school)?.label || "Shafi"}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-edge px-4 py-1.5 text-[12px] text-gold hover:text-ink"
              >
                Reconfigure
              </button>
            </div>
            {todaysPrayers ? (
              <div className="space-y-2">
                <div className="flex items-center px-4 py-1 text-[11px] font-medium uppercase tracking-wider text-subtle">
                  <span className="flex-1">Prayer</span>
                  <span className="w-24 text-center">Athan</span>
                  <span className="w-24 text-center">Iqamah</span>
                </div>
                {todaysPrayers.map((p) => (
                  <div
                    key={p.prayer_name}
                    className="flex items-center rounded-lg bg-ink/5 px-4 py-2.5"
                  >
                    <span className="flex-1 text-[13px] text-ink">
                      {PRAYER_DISPLAY_NAMES[p.prayer_name]}
                    </span>
                    <span className="w-24 text-center text-[13px] tabular-nums text-subtle">
                      {to12Hour(p.athan_time)}
                    </span>
                    <span className="w-24 text-center text-[13px] font-medium tabular-nums text-subtle">
                      {to12Hour(p.iqamah_time)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-subtle">Loading prayer times...</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Step Indicator */}
      {step !== "view" && <div className="mb-6 flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step === stepNum;
          const isDone = Number(step) > Number(stepNum);
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-highlight text-background"
                    : isDone
                      ? "bg-gold/20 text-subtle"
                      : "bg-ink/5 text-subtle"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                className={`text-[11px] ${isActive ? "text-ink" : "text-subtle"}`}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div className="mx-1 h-px w-6 bg-gold/20" />
              )}
            </div>
          );
        })}
      </div>}

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Step 1: Address */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-edge bg-card p-5">
              <p className="mb-1 text-sm font-medium text-ink">
                Mosque Address
              </p>
              <p className="mb-4 text-[12px] text-subtle">
                This address is used to calculate accurate prayer times.
              </p>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Staten Island, NY 10301"
                className="w-full rounded-lg border border-edge bg-card px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:border-edge-bold focus:outline-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => address.trim() ? setStep(2) : showToast("Address is required", "error")}
                className="rounded-lg bg-gold/20 px-5 py-2.5 text-sm font-medium text-gold hover:bg-gold/30"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Method + School */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-edge bg-card p-5">
              <p className="mb-1 text-sm font-medium text-ink">
                Calculation Method
              </p>
              <p className="mb-4 text-[12px] text-subtle">
                Most North American mosques use ISNA. This determines Fajr and Isha angles.
              </p>
              <select
                value={method}
                onChange={(e) => setMethod(Number(e.target.value))}
                className="mb-4 w-full rounded-lg border border-edge bg-card px-4 py-2.5 text-sm text-ink focus:border-edge-bold focus:outline-none"
              >
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <p className="mb-2 text-sm font-medium text-ink">School</p>
              <select
                value={school}
                onChange={(e) => setSchool(Number(e.target.value))}
                className="w-full rounded-lg border border-edge bg-card px-4 py-2.5 text-sm text-ink focus:border-edge-bold focus:outline-none"
              >
                {SCHOOLS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-edge px-5 py-2.5 text-sm text-gold hover:text-ink"
              >
                Back
              </button>
              <button
                onClick={fetchPreview}
                disabled={loading}
                className="rounded-lg bg-gold/20 px-5 py-2.5 text-sm font-medium text-gold hover:bg-gold/30 disabled:opacity-40"
              >
                {loading ? "Fetching..." : "Preview Times"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Athan Preview */}
        {step === 3 && previewTimings && (
          <div className="space-y-4">
            <div className="rounded-lg border border-edge bg-card p-5">
              <p className="mb-1 text-sm font-medium text-ink">
                Today&apos;s Athan Times
              </p>
              <p className="mb-4 text-[12px] text-subtle">
                Do these times look correct for your mosque?
              </p>
              <div className="space-y-2">
                {PRAYER_NAMES.map((prayer) => (
                  <div
                    key={prayer}
                    className="flex items-center justify-between rounded-lg bg-ink/5 px-4 py-2.5"
                  >
                    <span className="text-[13px] text-ink">
                      {PRAYER_DISPLAY_NAMES[prayer]}
                    </span>
                    <span className="text-[13px] font-medium tabular-nums text-ink">
                      {to12Hour(previewTimings[prayer])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-edge px-5 py-2.5 text-sm text-gold hover:text-ink"
              >
                Change Method
              </button>
              <button
                onClick={() => setStep(4)}
                className="rounded-lg bg-gold/20 px-5 py-2.5 text-sm font-medium text-gold hover:bg-gold/30"
              >
                Looks Good
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Iqamah Configuration */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-edge bg-card p-5">
              <p className="mb-1 text-sm font-medium text-ink">
                Iqamah Times
              </p>
              <p className="mb-4 text-[12px] text-subtle">
                Set how each prayer&apos;s congregation time is determined.
              </p>
              <div className="space-y-3">
                {iqamahRows.map((row, i) => (
                  <div
                    key={row.prayer_name}
                    className="flex items-center gap-3 rounded-lg bg-ink/5 px-4 py-3"
                  >
                    <span className="w-20 text-[13px] text-ink">
                      {PRAYER_DISPLAY_NAMES[row.prayer_name]}
                    </span>
                    <select
                      value={row.mode}
                      onChange={(e) =>
                        updateIqamahRow(i, { mode: e.target.value as IqamahMode })
                      }
                      className="rounded-lg border border-edge bg-card px-3 py-1.5 text-[12px] text-ink focus:outline-none"
                    >
                      <option value="fixed">Fixed Time</option>
                      <option value="offset">Offset from Athan</option>
                    </select>
                    {row.mode === "fixed" && (
                      <input
                        type="time"
                        value={row.fixed_time}
                        onChange={(e) =>
                          updateIqamahRow(i, { fixed_time: e.target.value })
                        }
                        className="rounded-lg border border-edge bg-card px-3 py-1.5 text-[12px] tabular-nums text-tan focus:outline-none"
                      />
                    )}
                    {row.mode === "offset" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={row.offset_minutes}
                          onChange={(e) =>
                            updateIqamahRow(i, {
                              offset_minutes: Number(e.target.value),
                            })
                          }
                          className="w-16 rounded-lg border border-edge bg-card px-3 py-1.5 text-[12px] tabular-nums text-tan focus:outline-none"
                        />
                        <span className="text-[11px] text-subtle">
                          min after athan
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="rounded-lg border border-edge px-5 py-2.5 text-sm text-gold hover:text-ink"
              >
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="rounded-lg bg-gold/20 px-5 py-2.5 text-sm font-medium text-gold hover:bg-gold/30"
              >
                Preview Final Times
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Final Preview + Save */}
        {step === 5 && finalPreview && (
          <div className="space-y-4">
            <div className="rounded-lg border border-edge bg-card p-5">
              <p className="mb-1 text-sm font-medium text-ink">
                Final Prayer Times
              </p>
              <p className="mb-4 text-[12px] text-subtle">
                This is what your app users will see.
              </p>
              <div className="space-y-2">
                <div className="flex items-center px-4 py-1 text-[11px] font-medium uppercase tracking-wider text-subtle">
                  <span className="flex-1">Prayer</span>
                  <span className="w-20 text-center">Athan</span>
                  <span className="w-20 text-center">Iqamah</span>
                </div>
                {PRAYER_NAMES.map((prayer) => (
                  <div
                    key={prayer}
                    className="flex items-center rounded-lg bg-ink/5 px-4 py-2.5"
                  >
                    <span className="flex-1 text-[13px] text-ink">
                      {PRAYER_DISPLAY_NAMES[prayer]}
                    </span>
                    <span className="w-24 text-center text-[13px] tabular-nums text-subtle">
                      {to12Hour(finalPreview[prayer].athan)}
                    </span>
                    <span className="w-24 text-center text-[13px] font-medium tabular-nums text-subtle">
                      {to12Hour(finalPreview[prayer].iqamah)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(4)}
                className="rounded-lg border border-edge px-5 py-2.5 text-sm text-gold hover:text-ink"
              >
                Adjust Iqamah
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save & Activate"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
