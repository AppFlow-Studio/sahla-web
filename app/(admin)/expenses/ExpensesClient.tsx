"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimateNumber } from "motion-number";
import { toast } from "sonner";

type Expense = {
  id: string;
  name: string;
  cost: number;
  frequency: string;
  category: string;
  vendor: string;
  notes: string;
  status: string;
  mosque_id: string | null;
};

type Mosque = { id: string; name: string };
type ExpenseInput = Omit<Expense, "id">;

const FREQUENCIES = ["monthly", "yearly", "one-time"] as const;
const CATEGORIES = ["Platform", "Mosque-specific", "Marketing", "Other"] as const;
const STATUSES = ["active", "paused", "cancelled"] as const;

const freqBadge: Record<string, { label: string; className: string }> = {
  monthly: { label: "Monthly", className: "bg-blue-50 text-blue-700" },
  yearly: { label: "Yearly", className: "bg-amber-50 text-amber-700" },
  "one-time": { label: "One-time", className: "bg-neutral-100 text-neutral-500" },
};

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
  paused: { label: "Paused", className: "bg-amber-50 text-amber-700" },
  cancelled: { label: "Cancelled", className: "bg-neutral-100 text-neutral-400" },
};

/** Monthly-equivalent cost. One-time expenses don't contribute to recurring burn. */
function monthlyEquiv(e: Expense) {
  if (e.status !== "active") return 0;
  if (e.frequency === "monthly") return e.cost;
  if (e.frequency === "yearly") return e.cost / 12;
  return 0;
}

function fmtCost(cost: number, frequency: string) {
  const v = cost.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (frequency === "yearly") return `${v}/yr`;
  if (frequency === "monthly") return `${v}/mo`;
  return v;
}

function fmtMoney(v: number, digits = 2) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits });
}

/* ── Filter Bar (Airbnb-style) ── */

const G = "#0A261E";
const G40 = "rgba(10,38,30,0.4)";
const G45 = "rgba(10,38,30,0.45)";
const G08 = "rgba(10,38,30,0.08)";
const G10 = "rgba(10,38,30,0.10)";
const G06 = "rgba(10,38,30,0.06)";
const TAN = "#fffbf2";

const pillBase: React.CSSProperties = {
  display: "flex", flexDirection: "row", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 9999, border: "none",
  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
};
const pillActive: React.CSSProperties = { backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" };
const pillIdle: React.CSSProperties = { backgroundColor: "transparent", boxShadow: "none" };
const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: G45, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1 };
const dividerStyle: React.CSSProperties = { width: 1, height: 20, backgroundColor: G10, flexShrink: 0 };
const dropStyle: React.CSSProperties = { position: "absolute", top: "100%", zIndex: 30, marginTop: 6, borderRadius: 14, border: `1px solid ${G08}`, backgroundColor: "#fff", boxShadow: "0 8px 28px rgba(0,0,0,0.12)" };
const listBtn: React.CSSProperties = { display: "block", width: "100%", padding: "8px 14px", textAlign: "left", fontSize: 13, border: "none", background: "none", cursor: "pointer", transition: "background 0.15s" };
const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "rgba(10,38,30,0.04)"; };
const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "transparent"; };
const clearBtnStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: 8, backgroundColor: G08, cursor: "pointer", flexShrink: 0 };

function ClearX({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <span onClick={onClick} style={clearBtnStyle}>
      <svg style={{ width: 9, height: 9, color: "rgba(10,38,30,0.5)" }} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
    </span>
  );
}

type ActiveSegment = "search" | "category" | "status" | null;

function ExpenseFilterBar({
  search, onSearch, freqFilter, onFreqFilter, catFilter, onCatFilter, statusFilter, onStatusFilter,
}: {
  search: string; onSearch: (v: string) => void;
  freqFilter: string; onFreqFilter: (v: string) => void;
  catFilter: string; onCatFilter: (v: string) => void;
  statusFilter: string; onStatusFilter: (v: string) => void;
}) {
  const [active, setActive] = useState<ActiveSegment>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active === "search") setTimeout(() => inputRef.current?.focus(), 0);
  }, [active]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (barRef.current && !barRef.current.contains(e.target as Node)) setActive(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  const toggle = (s: ActiveSegment) => setActive((cur) => (cur === s ? null : s));
  const isOpen = active !== null;

  const freqOpts = [{ label: "All", value: "" }, ...FREQUENCIES.map((f) => ({ label: freqBadge[f].label, value: f }))];

  return (
    <div ref={barRef} style={{ position: "relative", display: "inline-block" }}>
      <div style={{
        display: "flex", flexDirection: "row", alignItems: "center",
        borderRadius: 9999, border: `1px solid rgba(10,38,30,${isOpen ? "0.08" : "0.12"})`,
        backgroundColor: isOpen ? "#ede8e0" : "#fff",
        boxShadow: isOpen ? "0 3px 12px rgba(0,0,0,0.10)" : "0 1px 2px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
      }}>
        {/* Search segment */}
        <button onClick={() => toggle("search")} style={{ ...pillBase, minWidth: 180, ...active === "search" ? pillActive : pillIdle }}>
          <svg style={{ width: 14, height: 14, flexShrink: 0, color: G40 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
            <span style={labelStyle}>Search</span>
            <span style={{ fontSize: 13, fontWeight: search ? 600 : 400, color: search ? G : G40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140, marginTop: 1 }}>
              {search || "All expenses"}
            </span>
          </div>
          {search && <ClearX onClick={(e) => { e.stopPropagation(); onSearch(""); }} />}
        </button>

        <div style={dividerStyle} />

        {/* Category segment */}
        <button onClick={() => toggle("category")} style={{ ...pillBase, minWidth: 120, ...active === "category" ? pillActive : pillIdle }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
            <span style={labelStyle}>Category</span>
            <span style={{ fontSize: 13, fontWeight: catFilter ? 600 : 400, color: catFilter ? G : G40, marginTop: 1 }}>
              {catFilter || "Any"}
            </span>
          </div>
          {catFilter && <ClearX onClick={(e) => { e.stopPropagation(); onCatFilter(""); }} />}
        </button>

        <div style={dividerStyle} />

        {/* Status segment */}
        <button onClick={() => toggle("status")} style={{ ...pillBase, minWidth: 110, ...active === "status" ? pillActive : pillIdle }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
            <span style={labelStyle}>Status</span>
            <span style={{ fontSize: 13, fontWeight: statusFilter ? 600 : 400, color: statusFilter ? G : G40, marginTop: 1 }}>
              {statusFilter ? statusBadge[statusFilter].label : "Any"}
            </span>
          </div>
          {statusFilter && <ClearX onClick={(e) => { e.stopPropagation(); onStatusFilter(""); }} />}
        </button>

        <div style={dividerStyle} />

        {/* Frequency pills */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, padding: "4px 6px" }}>
          {freqOpts.map((opt) => (
            <button key={opt.value} onClick={() => onFreqFilter(opt.value)}
              style={{
                padding: "5px 10px", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 9999,
                cursor: "pointer", transition: "all 0.15s",
                backgroundColor: freqFilter === opt.value ? G : "transparent",
                color: freqFilter === opt.value ? "#fff" : G40,
              }}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Search dropdown */}
      {active === "search" && (
        <div style={{ ...dropStyle, left: 0, width: 320 }}>
          <div style={{ padding: 10 }}>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(10,38,30,0.3)" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input ref={inputRef} value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name or vendor..."
                style={{ width: "100%", borderRadius: 10, border: `1px solid ${G10}`, backgroundColor: TAN, padding: "7px 10px 7px 32px", fontSize: 13, color: G, outline: "none" }} />
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${G06}`, padding: "10px 14px" }}>
            <p style={{ fontSize: 12, color: G40, margin: 0 }}>Type to filter by name or vendor</p>
          </div>
        </div>
      )}

      {/* Category dropdown */}
      {active === "category" && (
        <div style={{ ...dropStyle, left: 190, width: 190 }}>
          <div style={{ maxHeight: 260, overflowY: "auto", padding: "3px 0" }}>
            <button onClick={() => { onCatFilter(""); setActive(null); }}
              style={{ ...listBtn, fontWeight: !catFilter ? 600 : 400, color: !catFilter ? G : "rgba(10,38,30,0.6)" }}
              onMouseEnter={hoverIn} onMouseLeave={hoverOut}
            >All Categories</button>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => { onCatFilter(c); setActive(null); }}
                style={{ ...listBtn, fontWeight: catFilter === c ? 600 : 400, color: catFilter === c ? G : "rgba(10,38,30,0.6)" }}
                onMouseEnter={hoverIn} onMouseLeave={hoverOut}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      {/* Status dropdown */}
      {active === "status" && (
        <div style={{ ...dropStyle, left: 320, width: 170 }}>
          <div style={{ padding: "3px 0" }}>
            <button onClick={() => { onStatusFilter(""); setActive(null); }}
              style={{ ...listBtn, fontWeight: !statusFilter ? 600 : 400, color: !statusFilter ? G : "rgba(10,38,30,0.6)" }}
              onMouseEnter={hoverIn} onMouseLeave={hoverOut}
            >Any Status</button>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => { onStatusFilter(s); setActive(null); }}
                style={{ ...listBtn, fontWeight: statusFilter === s ? 600 : 400, color: statusFilter === s ? G : "rgba(10,38,30,0.6)" }}
                onMouseEnter={hoverIn} onMouseLeave={hoverOut}
              >{statusBadge[s].label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Add / Edit Expense Modal ── */

const fieldClass = "w-full rounded-xl border border-[#0A261E]/15 bg-[#fffbf2] px-4 py-3 text-sm text-[#0A261E] placeholder-faint outline-none focus:border-pop/40";
const labelClass = "mb-1.5 block text-sm font-medium text-[#0A261E]/60";

function ExpenseModal({
  initial, mosques, onSubmit, onClose,
}: {
  initial: Expense | null;
  mosques: Mosque[];
  onSubmit: (e: ExpenseInput) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [cost, setCost] = useState(initial ? String(initial.cost) : "");
  const [frequency, setFrequency] = useState<string>(initial?.frequency ?? "monthly");
  const [category, setCategory] = useState<string>(initial?.category ?? "Platform");
  const [status, setStatus] = useState<string>(initial?.status ?? "active");
  const [mosqueId, setMosqueId] = useState<string>(initial?.mosque_id ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const isEdit = initial != null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cost) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        vendor: vendor.trim(),
        cost: parseFloat(cost),
        frequency,
        category,
        status,
        mosque_id: mosqueId || null,
        notes: notes.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-[480px] flex-col overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white shadow-xl"
      >
        <div className="relative flex items-center justify-center border-b border-[#0A261E]/8 px-6 py-4">
          <h2 className="text-base font-semibold text-[#0A261E]">{isEdit ? "Edit Expense" : "Add Expense"}</h2>
          <button onClick={onClose} className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-[#0A261E]/35 hover:bg-[#f5f0e8] hover:text-[#0A261E]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <div>
            <label className={labelClass}>Name</label>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Supabase Pro" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Vendor <span className="text-[#0A261E]/35">(optional)</span></label>
            <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Supabase" className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cost ($)</label>
              <input required type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="25" className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={fieldClass}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{freqBadge[f].label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                {STATUSES.map((s) => <option key={s} value={s}>{statusBadge[s].label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Linked Mosque <span className="text-[#0A261E]/35">(optional)</span></label>
            <select value={mosqueId} onChange={(e) => setMosqueId(e.target.value)} className={fieldClass}>
              <option value="">None</option>
              {mosques.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Notes <span className="text-[#0A261E]/35">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything worth remembering..." className={`${fieldClass} resize-none`} />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#0A261E]/60 hover:text-[#0A261E]">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#0A261E] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A261E]/90 disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main ── */

type SortKey = "name" | "cost";

export default function ExpensesClient({ initialExpenses, mosques }: { initialExpenses: Expense[]; mosques: Mosque[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; expense: Expense } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState<string>("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const mosqueName = useMemo(() => {
    const map = new Map(mosques.map((m) => [m.id, m.name]));
    return (id: string | null) => (id ? map.get(id) ?? "Unknown" : null);
  }, [mosques]);

  const filtered = useMemo(() => {
    let result = expenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q));
    }
    if (freqFilter) result = result.filter((e) => e.frequency === freqFilter);
    if (catFilter) result = result.filter((e) => e.category === catFilter);
    if (statusFilter) result = result.filter((e) => e.status === statusFilter);
    return result;
  }, [expenses, search, freqFilter, catFilter, statusFilter]);

  const sortComparator = useCallback((a: Expense, b: Expense) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
    return (monthlyEquiv(a) - monthlyEquiv(b)) * dir;
  }, [sortKey, sortDir]);

  // Group filtered expenses by category (in preferred order, then any extras).
  const groups = useMemo(() => {
    const byCat = new Map<string, Expense[]>();
    for (const e of filtered) {
      const arr = byCat.get(e.category) ?? [];
      arr.push(e);
      byCat.set(e.category, arr);
    }
    const order = [...CATEGORIES.filter((c) => byCat.has(c)), ...[...byCat.keys()].filter((c) => !CATEGORIES.includes(c as typeof CATEGORIES[number]))];
    return order.map((cat) => {
      const items = [...(byCat.get(cat) ?? [])].sort(sortComparator);
      const subtotal = items.reduce((s, e) => s + monthlyEquiv(e), 0);
      return { cat, items, subtotal };
    });
  }, [filtered, sortComparator]);

  const activeFiltered = useMemo(() => filtered.filter((e) => e.status === "active"), [filtered]);
  const monthly = useMemo(() => activeFiltered.filter((e) => e.frequency === "monthly").reduce((s, e) => s + e.cost, 0), [activeFiltered]);
  const yearly = useMemo(() => activeFiltered.filter((e) => e.frequency === "yearly").reduce((s, e) => s + e.cost, 0), [activeFiltered]);
  const effective = monthly + yearly / 12;

  const hasFilter = !!(search || freqFilter || catFilter || statusFilter);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  };

  const handleAdd = useCallback(async (expense: ExpenseInput) => {
    const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(expense) });
    if (!res.ok) { toast.error("Failed to add expense"); return; }
    const created = await res.json();
    setExpenses((prev) => [...prev, created]);
    setModal(null);
    toast.success(`Added "${expense.name}"`);
  }, []);

  const handleEdit = useCallback(async (id: string, expense: ExpenseInput) => {
    const res = await fetch("/api/expenses", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...expense }) });
    if (!res.ok) { toast.error("Failed to update expense"); return; }
    const updated = await res.json();
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    setModal(null);
    toast.success(`Updated "${expense.name}"`);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete expense"); setDeleting(null); return; }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
    toast.success(`Removed "${expense?.name}"`);
  }, [expenses]);

  const renderSortHeader = (label: string, k: SortKey) => (
    <th className="px-5 py-3 font-medium">
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-[#0A261E]">
        {label}
        <span className={sortKey === k ? "text-[#0A261E]/60" : "text-transparent"}>
          {sortKey === k && sortDir === "asc" ? "↑" : "↓"}
        </span>
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-[#0A261E]">Expenses</h1>
        <p className="mt-1 text-sm text-[#0A261E]/60">Track platform costs, subscriptions, and per-mosque expenses.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[#0A261E]/8 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#0A261E]/60">Monthly Burn</p>
          <div className="mt-2 font-mono text-2xl font-semibold text-[#dc2626]">
            <AnimateNumber format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} locales="en-US" transition={{ duration: 0.8 }}>{monthly}</AnimateNumber>
          </div>
        </div>
        <div className="rounded-xl border border-[#0A261E]/8 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#0A261E]/60">Yearly Costs</p>
          <div className="mt-2 font-mono text-2xl font-semibold text-amber-600">
            <AnimateNumber format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} locales="en-US" transition={{ duration: 0.8 }}>{yearly}</AnimateNumber>
          </div>
        </div>
        <div className="rounded-xl border border-[#0A261E]/8 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#0A261E]/60">Effective Monthly</p>
          <div className="mt-2 font-mono text-2xl font-semibold text-[#0A261E]">
            <AnimateNumber format={{ style: "currency", currency: "USD", maximumFractionDigits: 2 }} locales="en-US" transition={{ duration: 0.8 }}>{effective}</AnimateNumber>
          </div>
        </div>
        <div className="rounded-xl border border-[#0A261E]/8 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#0A261E]/60">Active Subscriptions</p>
          <div className="mt-2 font-mono text-2xl font-semibold text-[#0A261E]">
            <AnimateNumber transition={{ duration: 0.8 }}>{activeFiltered.length}</AnimateNumber>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <ExpenseFilterBar
        search={search} onSearch={setSearch}
        freqFilter={freqFilter} onFreqFilter={setFreqFilter}
        catFilter={catFilter} onCatFilter={setCatFilter}
        statusFilter={statusFilter} onStatusFilter={setStatusFilter}
      />

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-xl border border-[#0A261E]/8 bg-white">
        <div className="flex items-center justify-between border-b border-[#0A261E]/8 px-5 py-4">
          <p className="text-sm font-medium text-[#0A261E]/60">
            {hasFilter ? `${filtered.length} of ${expenses.length} expenses` : "All Expenses"}
          </p>
          <button onClick={() => setModal({ mode: "add" })}
            className="flex items-center gap-1.5 rounded-lg bg-[#0A261E] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0A261E]/90">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Expense
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#0A261E]/35">
            {hasFilter ? "No expenses match your search." : "No expenses yet. Add your first subscription to start tracking costs."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#0A261E]/8 text-xs uppercase tracking-wider text-[#0A261E]/35">
                  {renderSortHeader("Name", "name")}
                  {renderSortHeader("Cost", "cost")}
                  <th className="px-5 py-3 font-medium">Frequency</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Mosque</th>
                  <th className="w-20 px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <React.Fragment key={group.cat}>
                    {/* Category group header */}
                    <tr className="bg-[#f5f0e8]/60">
                      <td colSpan={5} className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#0A261E]/60">
                        {group.cat} <span className="ml-1 font-normal text-[#0A261E]/35">· {group.items.length}</span>
                      </td>
                      <td className="px-5 py-2 text-right font-mono text-xs text-[#0A261E]/60">{fmtMoney(group.subtotal)}/mo</td>
                    </tr>
                    {group.items.map((exp) => {
                      const fb = freqBadge[exp.frequency] ?? freqBadge["one-time"];
                      const sb = statusBadge[exp.status] ?? statusBadge.active;
                      const dim = exp.status !== "active";
                      const mName = mosqueName(exp.mosque_id);
                      return (
                        <tr key={exp.id} onClick={() => setModal({ mode: "edit", expense: exp })}
                          className={`group cursor-pointer border-b border-[#0A261E]/8 transition-colors last:border-0 hover:bg-[#f5f0e8] ${dim ? "opacity-55" : ""}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 font-medium text-[#0A261E]">
                              {exp.name}
                              {exp.notes && (
                                <span title={exp.notes} className="inline-flex">
                                  <svg className="h-3.5 w-3.5 text-[#0A261E]/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h4.5M3.75 3.75h16.5v16.5H3.75z" /></svg>
                                </span>
                              )}
                            </div>
                            {exp.vendor && <div className="text-xs text-[#0A261E]/40">{exp.vendor}</div>}
                          </td>
                          <td className="px-5 py-3 font-mono text-[#0A261E]">{fmtCost(exp.cost, exp.frequency)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${fb.className}`}>{fb.label}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${sb.className}`}>{sb.label}</span>
                          </td>
                          <td className="px-5 py-3 text-[#0A261E]/60">{mName ?? <span className="text-[#0A261E]/25">—</span>}</td>
                          <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                            {deleting === exp.id ? (
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => handleDelete(exp.id)} className="text-xs font-medium text-[#dc2626] hover:text-red-700">Confirm</button>
                                <button onClick={() => setDeleting(null)} className="text-xs text-[#0A261E]/35 hover:text-[#0A261E]">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <button onClick={() => setModal({ mode: "edit", expense: exp })} title="Edit" className="text-[#0A261E]/35 transition-colors hover:text-[#0A261E]">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                                </button>
                                <button onClick={() => setDeleting(exp.id)} title="Delete" className="text-[#0A261E]/35 transition-colors hover:text-[#dc2626]">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#0A261E]/10 bg-[#f5f0e8]/40">
                  <td className="px-5 py-3 text-sm font-semibold text-[#0A261E]">Total</td>
                  <td className="px-5 py-3 font-mono text-sm font-semibold text-[#0A261E]" colSpan={5}>{fmtMoney(effective)}<span className="font-normal text-[#0A261E]/40">/mo effective</span></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {modal?.mode === "add" && (
        <ExpenseModal initial={null} mosques={mosques} onSubmit={handleAdd} onClose={() => setModal(null)} />
      )}
      {modal?.mode === "edit" && (
        <ExpenseModal initial={modal.expense} mosques={mosques} onSubmit={(e) => handleEdit(modal.expense.id, e)} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
