"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Program = { id: string; name: string };

async function fetchPrograms(): Promise<Program[]> {
  const res = await fetch("/api/crm/content?kind=program", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load programs (${res.status})`);
  const body = (await res.json()) as { items?: Program[] };
  return body.items ?? [];
}

async function fetchAssigned(categoryId: string): Promise<string[]> {
  const res = await fetch(
    `/api/crm/program-categories/assignments?categoryId=${encodeURIComponent(categoryId)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Failed to load assignments (${res.status})`);
  const body = (await res.json()) as { contentIds?: string[] };
  return body.contentIds ?? [];
}

export default function AssignProgramsModal({
  categoryId,
  categoryTitle,
  onClose,
  onSaved,
}: {
  categoryId: string;
  categoryTitle: string;
  onClose: () => void;
  onSaved: (count: number) => void;
}) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([fetchPrograms(), fetchAssigned(categoryId)])
      .then(([list, assigned]) => {
        if (!alive) return;
        setPrograms(list);
        setSelected(new Set(assigned));
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [categoryId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => p.name.toLowerCase().includes(q));
  }, [programs, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const contentIds = Array.from(selected);
      const res = await fetch("/api/crm/program-categories/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, contentIds }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Save failed");
      }
      const body = (await res.json()) as { contentIds: string[] };
      toast.success("Programs updated");
      onSaved(body.contentIds.length);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#0A261E]/10 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#0A261E]/8 px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#0A261E]">
              Programs in “{categoryTitle}”
            </p>
            <p className="text-[12px] text-[#0A261E]/55">
              Choose which programs appear under this card.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[#0A261E]/50 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-[#0A261E]/6 px-4 py-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-[#0A261E]/10 px-2.5 py-1.5">
            <Search size={14} className="text-[#0A261E]/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search programs…"
              className="w-full bg-transparent text-[13px] text-[#0A261E] outline-none placeholder:text-[#0A261E]/35"
            />
          </div>
        </div>

        <div className="min-h-[120px] flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={18} className="animate-spin text-[#0A261E]/40" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-[12.5px] text-[#0A261E]/55">
              {programs.length === 0
                ? "No programs yet. Create programs under Content → Programs first."
                : "No programs match your search."}
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#0A261E]/[0.03]"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          checked
                            ? "border-[#0A261E] bg-[#0A261E] text-white"
                            : "border-[#0A261E]/25"
                        )}
                      >
                        {checked ? <Check size={13} /> : null}
                      </span>
                      <span className="truncate text-[13px] text-[#0A261E]">
                        {p.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#0A261E]/8 px-5 py-3">
          <span className="text-[12px] text-[#0A261E]/55">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
