"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  BadgePercent,
  Loader2,
  Ticket,
  Plus,
  Copy,
  Check,
  Calendar,
  Infinity as InfinityIcon,
  Power,
} from "lucide-react";
import type { PromoCodeSummary } from "@/app/api/admin/promo-codes/route";

type DiscountType = "percent" | "amount";
type Duration = "once" | "forever" | "repeating";

function durationLabel(d: Duration, months: string): string {
  if (d === "forever") return "forever";
  if (d === "repeating") return `${months || "N"} months`;
  return "first invoice";
}

function fmtDiscount(c: PromoCodeSummary["coupon"]): string {
  const amount =
    c.percentOff != null
      ? `${c.percentOff}% off`
      : c.amountOff != null
      ? `${(c.amountOff / 100).toLocaleString("en-US", {
          style: "currency",
          currency: (c.currency ?? "usd").toUpperCase(),
          minimumFractionDigits: c.amountOff % 100 === 0 ? 0 : 2,
        })} off`
      : "—";
  const dur =
    c.duration === "forever"
      ? "forever"
      : c.duration === "once"
      ? "first invoice"
      : `${c.durationInMonths} mo`;
  return `${amount} · ${dur}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "No expiry";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Field wrapper for consistent labels ── */
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-faint">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-edge bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-ink/30 focus:ring-2 focus:ring-ink/5";

/* ── Existing code row ── */
function CodeRow({
  c,
  busy,
  onToggle,
  index,
}: {
  c: PromoCodeSummary;
  busy: boolean;
  onToggle: () => void;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const pct =
    c.maxRedemptions != null && c.maxRedemptions > 0
      ? Math.min(100, Math.round((c.timesRedeemed / c.maxRedemptions) * 100))
      : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Couldn't copy.");
    }
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className={`group flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 transition-colors hover:bg-sand/50 ${
        c.active ? "" : "opacity-70"
      }`}
    >
      {/* Code chip + copy */}
      <button
        onClick={copy}
        title="Copy code"
        className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-1.5 font-mono text-[12.5px] font-semibold uppercase tracking-wide text-white transition-transform hover:scale-[1.02] active:scale-95"
      >
        {c.code}
        {copied ? (
          <Check size={12} className="text-emerald-300" />
        ) : (
          <Copy size={12} className="text-white/50 transition-colors group-hover:text-white/80" />
        )}
      </button>

      {/* Discount */}
      <span className="inline-flex items-center gap-1.5 rounded-md bg-ink/5 px-2.5 py-1 text-[12.5px] font-semibold text-ink ring-1 ring-edge">
        <BadgePercent size={12} className="text-ink/50" />
        {fmtDiscount(c.coupon)}
      </span>

      {/* Usage */}
      <div className="flex min-w-[92px] flex-col gap-1">
        <span className="text-[12px] font-medium text-subtle tabular-nums">
          {c.timesRedeemed}
          {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""} used
        </span>
        {pct != null ? (
          <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-ink/40" style={{ width: `${pct}%` }} />
          </div>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-faint">
            <InfinityIcon size={11} /> unlimited
          </span>
        )}
      </div>

      {/* Expiry */}
      <span className="flex items-center gap-1.5 text-[12px] text-faint">
        <Calendar size={12} />
        {fmtDate(c.expiresAt)}
      </span>

      {/* Status + action */}
      <div className="ml-auto flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            c.active
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20"
              : "bg-ink/5 text-faint ring-1 ring-edge"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${c.active ? "bg-emerald-500" : "bg-faint"}`} />
          {c.active ? "Active" : "Inactive"}
        </span>
        <button
          onClick={onToggle}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-edge px-2.5 py-1.5 text-[12px] font-semibold text-subtle transition-colors hover:border-edge-bold hover:text-ink disabled:opacity-50"
        >
          <Power size={12} />
          {c.active ? "Deactivate" : "Reactivate"}
        </button>
      </div>
    </motion.li>
  );
}

export default function PromoCodesClient() {
  const [codes, setCodes] = useState<PromoCodeSummary[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Create form
  const [code, setCode] = useState("");
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState("");
  const [duration, setDuration] = useState<Duration>("once");
  const [months, setMonths] = useState("3");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/admin/promo-codes");
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { codes: PromoCodeSummary[] };
      setCodes(body.codes);
    } catch {
      setCodes([]);
      toast.error("Couldn't load promo codes.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCode() {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      toast.error("Enter a discount value greater than 0.");
      return;
    }
    if (type === "percent" && numeric > 100) {
      toast.error("A percentage discount can't exceed 100%.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim() || undefined,
          type,
          value: numeric,
          duration,
          durationInMonths: duration === "repeating" ? Number(months) : undefined,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
          expiresAt: expiresAt || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { code?: PromoCodeSummary; error?: string };
      if (!res.ok || !body.code) throw new Error(body.error ?? "Failed to create promo code.");
      setCodes((prev) => [body.code as PromoCodeSummary, ...(prev ?? [])]);
      setCode("");
      setValue("");
      setMaxRedemptions("");
      setExpiresAt("");
      toast.success(`Code ${body.code.code} created.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create promo code.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(pc: PromoCodeSummary) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/promo-codes/${pc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !pc.active }),
      });
      const body = (await res.json().catch(() => ({}))) as { active?: boolean; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to update code.");
      setCodes((prev) => (prev ?? []).map((c) => (c.id === pc.id ? { ...c, active: !pc.active } : c)));
      toast.success(pc.active ? "Code deactivated." : "Code reactivated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update code.");
    } finally {
      setBusy(false);
    }
  }

  // Derived stats
  const stats = useMemo(() => {
    const list = codes ?? [];
    return {
      total: list.length,
      active: list.filter((c) => c.active).length,
      redemptions: list.reduce((sum, c) => sum + (c.timesRedeemed ?? 0), 0),
    };
  }, [codes]);

  // Live preview of the code being built
  const preview = useMemo(() => {
    const n = Number(value);
    const hasValue = Number.isFinite(n) && n > 0;
    const disc = !hasValue
      ? "— off"
      : type === "percent"
      ? `${n}% off`
      : `$${n} off`;
    return { code: code.trim() || "NEWCODE", disc, dur: durationLabel(duration, months) };
  }, [code, value, type, duration, months]);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ink/10 to-ink/5 text-ink">
            <Ticket size={20} />
          </div>
          <div>
            <h1 className="font-display text-3xl text-ink">Promo codes</h1>
            <p className="mt-0.5 text-[13px] text-subtle">
              Codes mosques can enter at go-live checkout for a discount on their first invoice.
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total codes", value: stats.total },
          { label: "Active", value: stats.active, accent: true },
          { label: "Total redemptions", value: stats.redemptions },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="rounded-2xl border border-edge bg-white px-5 py-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              {s.accent && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
              <p className="text-xs font-medium text-subtle">{s.label}</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-ink tabular-nums">
              {codes === null ? "—" : s.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Create card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6 overflow-hidden rounded-2xl border border-edge bg-white shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-edge bg-sand/50 px-5 py-3.5">
          <Plus size={15} className="text-faint" />
          <p className="text-[13.5px] font-semibold text-ink">Create a code</p>
        </div>

        <div className="grid grid-cols-2 gap-4 px-5 py-5 sm:grid-cols-3 lg:grid-cols-4">
          {/* Code */}
          <Field label="Code" className="col-span-2 sm:col-span-1">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="RAMADAN25"
              className={`${inputCls} font-mono uppercase tracking-wide`}
            />
          </Field>

          {/* Type toggle */}
          <Field label="Type">
            <div className="inline-flex w-full rounded-lg border border-edge p-0.5">
              {(["percent", "amount"] as DiscountType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    type === t ? "bg-ink text-white shadow-sm" : "text-subtle hover:text-ink"
                  }`}
                >
                  {t === "percent" ? "% Percent" : "$ Amount"}
                </button>
              ))}
            </div>
          </Field>

          {/* Value */}
          <Field label="Amount">
            <div className={`flex items-center ${inputCls} px-2.5 py-0 focus-within:border-ink/30 focus-within:ring-2 focus-within:ring-ink/5`}>
              {type === "amount" && <span className="text-[13px] text-faint">$</span>}
              <input
                type="number"
                min={0}
                max={type === "percent" ? 100 : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "percent" ? "20" : "50"}
                className="w-full bg-transparent px-1 py-2 text-[13px] text-ink outline-none tabular-nums"
              />
              {type === "percent" && <span className="text-[13px] text-faint">%</span>}
            </div>
          </Field>

          {/* Duration */}
          <Field label="Duration">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="once">First invoice</option>
              <option value="forever">Forever</option>
              <option value="repeating">For N months</option>
            </select>
          </Field>

          {duration === "repeating" && (
            <Field label="Months">
              <div className={`flex items-center ${inputCls} px-2.5 py-0`}>
                <input
                  type="number"
                  min={1}
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="w-full bg-transparent px-1 py-2 text-[13px] text-ink outline-none tabular-nums"
                />
                <span className="text-[13px] text-faint">mo</span>
              </div>
            </Field>
          )}

          {/* Max redemptions */}
          <Field label="Max uses">
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="∞ unlimited"
              className={`${inputCls} tabular-nums`}
            />
          </Field>

          {/* Expiry */}
          <Field label="Expires">
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            />
          </Field>
        </div>

        {/* Footer: live preview + create */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge bg-sand/40 px-5 py-3.5">
          <div className="flex items-center gap-2 text-[12px] text-subtle">
            <span className="text-faint">Preview</span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-edge-bold bg-white px-2.5 py-1">
              <span className="font-mono text-[12px] font-semibold uppercase tracking-wide text-ink">
                {preview.code}
              </span>
              <span className="text-faint">·</span>
              <span className="font-medium text-ink">{preview.disc}</span>
              <span className="text-faint">·</span>
              <span className="text-subtle">{preview.dur}</span>
            </span>
          </div>
          <button
            onClick={createCode}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-ink/90 hover:shadow disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <BadgePercent size={13} />}
            Create code
          </button>
        </div>
      </motion.div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-edge bg-sand/50 px-5 py-3.5">
          <p className="text-[13.5px] font-semibold text-ink">Existing codes</p>
          {codes && codes.length > 0 && (
            <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-semibold text-faint">
              {codes.length}
            </span>
          )}
        </div>
        {codes === null ? (
          <div className="flex items-center gap-2 px-5 py-10 text-[13px] text-faint">
            <Loader2 size={14} className="animate-spin" /> Loading codes…
          </div>
        ) : codes.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-5 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/5">
              <Ticket size={22} className="text-faint" />
            </div>
            <p className="text-[13.5px] font-medium text-subtle">No promo codes yet</p>
            <p className="max-w-xs text-[12px] text-faint">
              Create one above — mosques can redeem it at go-live checkout for a discount.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-edge">
            <AnimatePresence initial={false}>
              {codes.map((c, i) => (
                <CodeRow key={c.id} c={c} busy={busy} onToggle={() => toggleActive(c)} index={i} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
