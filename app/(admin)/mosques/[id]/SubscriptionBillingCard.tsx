"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BadgePercent, Loader2, Tag, Trash2 } from "lucide-react";
import type { DiscountResponse, DiscountSummary } from "@/app/api/mosques/[id]/stripe/discount/route";

type DiscountType = "percent" | "amount";
type Duration = "once" | "forever" | "repeating";

function fmtCents(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** "20% off · forever" / "$50 off · 12 mo" */
function describeDiscount(d: DiscountSummary, currency: string): string {
  const amount =
    d.percentOff != null
      ? `${d.percentOff}% off`
      : `${fmtCents(d.amountOff, d.currency ?? currency)} off`;
  const dur =
    d.duration === "forever"
      ? "forever"
      : d.duration === "once"
      ? "first invoice"
      : `${d.durationInMonths} mo`;
  return `${amount} · ${dur}`;
}

export default function SubscriptionBillingCard({ mosqueId }: { mosqueId: string }) {
  const [data, setData] = useState<DiscountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Form state
  const [type, setType] = useState<DiscountType>("percent");
  const [value, setValue] = useState("");
  const [duration, setDuration] = useState<Duration>("forever");
  const [months, setMonths] = useState("12");

  async function load() {
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/stripe/discount`);
      if (!res.ok) throw new Error();
      setData((await res.json()) as DiscountResponse);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mosqueId]);

  async function applyDiscount() {
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
      const res = await fetch(`/api/mosques/${mosqueId}/stripe/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          value: numeric,
          duration,
          durationInMonths: duration === "repeating" ? Number(months) : undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as DiscountResponse & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to apply discount.");
      setData(body);
      setValue("");
      toast.success("Discount applied to the subscription.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply discount.");
    } finally {
      setBusy(false);
    }
  }

  async function removeDiscount() {
    if (!confirm("Remove this discount? The mosque returns to full price on the next invoice.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/stripe/discount`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as DiscountResponse & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to remove discount.");
      setData(body);
      toast.success("Discount removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove discount.");
    } finally {
      setBusy(false);
    }
  }

  const currency = data?.currency ?? "usd";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.15, ease: "easeOut" }}
      className="max-w-3xl overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/60 px-6 py-4">
        <BadgePercent size={15} className="text-stone-500" />
        <p className="text-[14px] font-semibold text-stone-900">Subscription &amp; Billing</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 px-6 py-8 text-[13px] text-stone-400">
          <Loader2 size={14} className="animate-spin" /> Loading subscription…
        </div>
      ) : !data?.hasSubscription ? (
        <div className="px-6 py-8 text-[13px] text-stone-400">
          No active Stripe subscription yet. Discounts can be applied once the mosque has gone live and paid.
        </div>
      ) : (
        <div className="px-6 py-5">
          {/* Current price row */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Billed monthly</p>
              <p className="mt-1 flex items-baseline gap-2">
                {data.discount ? (
                  <>
                    <span className="text-[24px] font-semibold tabular-nums text-stone-900">
                      {fmtCents(data.netCents, currency)}
                    </span>
                    <span className="text-[14px] text-stone-400 line-through">
                      {fmtCents(data.baseCents, currency)}
                    </span>
                  </>
                ) : (
                  <span className="text-[24px] font-semibold tabular-nums text-stone-900">
                    {fmtCents(data.baseCents, currency)}
                  </span>
                )}
              </p>
            </div>
            {data.status && (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-stone-600">
                {data.status}
              </span>
            )}
          </div>

          {/* Active discount banner */}
          {data.discount && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] text-emerald-800">
                <Tag size={14} className="shrink-0" />
                <span className="font-semibold">{describeDiscount(data.discount, currency)}</span>
              </div>
              <button
                onClick={removeDiscount}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          )}

          {/* Apply / replace discount form */}
          <div className="mt-5 border-t border-stone-100 pt-5">
            <p className="mb-3 text-[12px] font-semibold text-stone-700">
              {data.discount ? "Replace discount" : "Apply a discount"}
            </p>

            <div className="flex flex-wrap items-end gap-3">
              {/* Type toggle */}
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

              {/* Value */}
              <div>
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
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as Duration)}
                className="rounded-lg border border-stone-200 px-3 py-2 text-[13px] text-stone-800 outline-none focus:border-stone-400"
              >
                <option value="forever">Forever</option>
                <option value="once">First invoice</option>
                <option value="repeating">For N months</option>
              </select>

              {duration === "repeating" && (
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
              )}

              <button
                onClick={applyDiscount}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <BadgePercent size={13} />}
                Apply
              </button>
            </div>
            <p className="mt-3 text-[11.5px] text-stone-400">
              Creates a Stripe coupon and attaches it to this mosque&apos;s subscription. Takes effect on the next invoice.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
