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
};

const FREQUENCIES = ["monthly", "yearly", "one-time"] as const;
const CATEGORIES = ["Platform", "Mosque-specific", "Marketing", "Other"] as const;

const freqBadge: Record<string, { label: string; className: string }> = {
  monthly: { label: "Monthly", className: "bg-blue-50 text-blue-700" },
  yearly: { label: "Yearly", className: "bg-amber-50 text-amber-700" },
  "one-time": { label: "One-time", className: "bg-neutral-100 text-neutral-500" },
};

function fmtCost(cost: number, frequency: string) {
  const v = cost.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (frequency === "yearly") return `${v}/yr`;
  if (frequency === "monthly") return `${v}/mo`;
  return v;
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

type ActiveSegment = "search" | "category" | null;

function ExpenseFilterBar({
  search, onSearch, freqFilter, onFreqFilter, catFilter, onCatFilter,
}: {
  search: string; onSearch: (v: string) => void;
  freqFilter: string; onFreqFilter: (v: string) => void;
  catFilter: string; onCatFilter: (v: string) => void;
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
              <input ref={inputRef} value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name..."
                style={{ width: "100%", borderRadius: 10, border: `1px solid ${G10}`, backgroundColor: TAN, padding: "7px 10px 7px 32px", fontSize: 13, color: G, outline: "none" }} />
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${G06}`, padding: "10px 14px" }}>
            <p style={{ fontSize: 12, color: G40, margin: 0 }}>Type to filter expenses by name</p>
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
    </div>
  );
}

/* ── Add Expense Modal ── */

function AddExpenseModal({ onAdd, onClose }: { onAdd: (e: Omit<Expense, "id">) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [frequency, setFrequency] = useState<string>("monthly");
  const [category, setCategory] = useState<string>("Platform");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cost) return;
    onAdd({ name: name.trim(), cost: parseFloat(cost), frequency, category });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-[480px] flex-col overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white shadow-xl"
      >
        <div className="relative flex items-center justify-center border-b border-[#0A261E]/8 px-6 py-4">
          <h2 className="text-base font-semibold text-[#0A261E]">Add Expense</h2>
          <button onClick={onClose} className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-[#0A261E]/35 hover:bg-[#f5f0e8] hover:text-[#0A261E]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-6 py-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A261E]/60">Name</label>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Supabase Pro"
              className="w-full rounded-xl border border-[#0A261E]/15 bg-[#fffbf2] px-4 py-3 text-sm text-[#0A261E] placeholder-faint outline-none focus:border-pop/40" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A261E]/60">Cost ($)</label>
            <input required type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="25"
              className="w-full rounded-xl border border-[#0A261E]/15 bg-[#fffbf2] px-4 py-3 text-sm text-[#0A261E] placeholder-faint outline-none focus:border-pop/40" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A261E]/60">Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-xl border border-[#0A261E]/15 bg-[#fffbf2] px-4 py-3 text-sm text-[#0A261E] outline-none focus:border-pop/40">
              {FREQUENCIES.map((f) => <option key={f} value={f}>{freqBadge[f].label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0A261E]/60">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[#0A261E]/15 bg-[#fffbf2] px-4 py-3 text-sm text-[#0A261E] outline-none focus:border-pop/40">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#0A261E]/60 hover:text-[#0A261E]">Cancel</button>
            <button type="submit" className="rounded-xl bg-[#0A261E] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A261E]/90">Add Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main ── */

export default function ExpensesClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState<string>("");
  const [catFilter, setCatFilter] = useState<string>("");

  const filtered = useMemo(() => {
    let result = expenses;
    if (search.trim()) { const q = search.toLowerCase(); result = result.filter((e) => e.name.toLowerCase().includes(q)); }
    if (freqFilter) result = result.filter((e) => e.frequency === freqFilter);
    if (catFilter) result = result.filter((e) => e.category === catFilter);
    return result;
  }, [expenses, search, freqFilter, catFilter]);

  const monthly = useMemo(() => filtered.filter((e) => e.frequency === "monthly").reduce((s, e) => s + e.cost, 0), [filtered]);
  const yearly = useMemo(() => filtered.filter((e) => e.frequency === "yearly").reduce((s, e) => s + e.cost, 0), [filtered]);
  const effective = monthly + yearly / 12;

  const handleAdd = useCallback(async (expense: Omit<Expense, "id">) => {
    const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(expense) });
    if (!res.ok) { toast.error("Failed to add expense"); return; }
    const created = await res.json();
    setExpenses((prev) => [...prev, created]);
    setShowAdd(false);
    toast.success(`Added "${expense.name}"`);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete expense"); setDeleting(null); return; }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
    toast.success(`Removed "${expense?.name}"`);
  }, [expenses]);

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
          <p className="text-xs font-medium uppercase tracking-wider text-[#0A261E]/60">Subscriptions</p>
          <div className="mt-2 font-mono text-2xl font-semibold text-[#0A261E]">
            <AnimateNumber transition={{ duration: 0.8 }}>{filtered.length}</AnimateNumber>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <ExpenseFilterBar
        search={search} onSearch={setSearch}
        freqFilter={freqFilter} onFreqFilter={setFreqFilter}
        catFilter={catFilter} onCatFilter={setCatFilter}
      />

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-xl border border-[#0A261E]/8 bg-white">
        <div className="flex items-center justify-between border-b border-[#0A261E]/8 px-5 py-4">
          <p className="text-sm font-medium text-[#0A261E]/60">
            {search || freqFilter || catFilter ? `${filtered.length} of ${expenses.length} expenses` : "All Expenses"}
          </p>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#0A261E] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0A261E]/90">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Expense
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#0A261E]/35">
            {search || freqFilter || catFilter ? "No expenses match your search." : "No expenses yet. Add your first subscription to start tracking costs."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#0A261E]/8 text-xs uppercase tracking-wider text-[#0A261E]/35">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Cost</th>
                  <th className="px-5 py-3 font-medium">Frequency</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="w-12 px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => {
                  const fb = freqBadge[exp.frequency] ?? freqBadge["one-time"];
                  return (
                    <tr key={exp.id} className="border-b border-[#0A261E]/8 transition-colors last:border-0 hover:bg-[#f5f0e8]">
                      <td className="px-5 py-3 font-medium text-[#0A261E]">{exp.name}</td>
                      <td className="px-5 py-3 font-mono text-[#0A261E]">{fmtCost(exp.cost, exp.frequency)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${fb.className}`}>{fb.label}</span>
                      </td>
                      <td className="px-5 py-3 text-[#0A261E]/60">{exp.category}</td>
                      <td className="px-5 py-3">
                        {deleting === exp.id ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleDelete(exp.id)} className="text-xs font-medium text-[#dc2626] hover:text-red-700">Confirm</button>
                            <button onClick={() => setDeleting(null)} className="text-xs text-[#0A261E]/35 hover:text-[#0A261E]">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleting(exp.id)} className="text-[#0A261E]/35 transition-colors hover:text-[#dc2626]">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddExpenseModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
