"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BadgePercent, Loader2, Ticket, Plus } from "lucide-react";
import type { PromoCodeSummary } from "@/app/api/admin/promo-codes/route";

type DiscountType = "percent" | "amount";
type Duration = "once" | "forever" | "repeating";

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
      setCodes((prev) =>
        (prev ?? []).map((c) => (c.id === pc.id ? { ...c, active: !pc.active } : c))
      );
      toast.success(pc.active ? "Code deactivated." : "Code reactivated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Ticket className="text-[#0A261E]" size={22} />
        <div>
          <h1 className="font-display text-3xl text-[#0A261E]">Promo codes</h1>
          <p className="mt-0.5 text-[13px] text-[#0A261E]/55">
            Codes mosques can enter at go-live checkout to get a discount from their first invoice.
          </p>
        </div>
      </div>

      {/* Create card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/60 px-5 py-3.5">
          <Plus size={15} className="text-stone-500" />
          <p className="text-[13.5px] font-semibold text-stone-900">Create a code</p>
        </div>
        <div className="flex flex-wrap items-end gap-3 px-5 py-5">
          {/* Code */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="RAMADAN25"
              className="w-36 rounded-lg border border-stone-200 px-3 py-2 text-[13px] font-mono uppercase tracking-wide text-stone-900 outline-none focus:border-stone-400"
            />
          </div>

          {/* Type toggle */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Type</label>
            <div className="inline-flex rounded-lg border border-stone-200 p-0.5">
              {(["percent", "amount"] as DiscountType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    type === t ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {t === "percent" ? "%" : "$"}
                </button>
              ))}
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Amount</label>
            <div className="flex items-center rounded-lg border border-stone-200 px-2.5 focus-within:border-stone-400">
              {type === "amount" && <span className="text-[13px] text-stone-400">$</span>}
              <input
                type="number"
                min={0}
                max={type === "percent" ? 100 : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "percent" ? "20" : "50"}
                className="w-20 bg-transparent px-1 py-1.5 text-[13px] text-stone-900 outline-none tabular-nums"
              />
              {type === "percent" && <span className="text-[13px] text-stone-400">%</span>}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-[13px] text-stone-800 outline-none focus:border-stone-400"
            >
              <option value="once">First invoice</option>
              <option value="forever">Forever</option>
              <option value="repeating">For N months</option>
            </select>
          </div>

          {duration === "repeating" && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Months</label>
              <div className="flex items-center rounded-lg border border-stone-200 px-2.5 focus-within:border-stone-400">
                <input
                  type="number"
                  min={1}
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="w-14 bg-transparent px-1 py-1.5 text-[13px] text-stone-900 outline-none tabular-nums"
                />
                <span className="text-[13px] text-stone-400">mo</span>
              </div>
            </div>
          )}

          {/* Max redemptions */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Max uses</label>
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="∞"
              className="w-20 rounded-lg border border-stone-200 px-3 py-2 text-[13px] text-stone-900 outline-none focus:border-stone-400 tabular-nums"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Expires</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-[13px] text-stone-800 outline-none focus:border-stone-400"
            />
          </div>

          <button
            onClick={createCode}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <BadgePercent size={13} />}
            Create
          </button>
        </div>
      </motion.div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-5 py-3.5">
          <p className="text-[13.5px] font-semibold text-stone-900">Existing codes</p>
        </div>
        {codes === null ? (
          <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-stone-400">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : codes.length === 0 ? (
          <div className="px-5 py-8 text-[13px] text-stone-400">
            No promo codes yet. Create one above.
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {codes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <span className="rounded-md bg-stone-900 px-2.5 py-1 font-mono text-[12.5px] font-semibold uppercase tracking-wide text-white">
                  {c.code}
                </span>
                <span className="text-[13px] font-medium text-stone-800">{fmtDiscount(c.coupon)}</span>
                <span className="text-[12px] text-stone-500">
                  {c.timesRedeemed}
                  {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""} used
                </span>
                <span className="text-[12px] text-stone-500">{fmtDate(c.expiresAt)}</span>
                <div className="ml-auto flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      c.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleActive(c)}
                    disabled={busy}
                    className="text-[12px] font-semibold text-stone-500 hover:text-stone-900 disabled:opacity-50"
                  >
                    {c.active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
