"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Eye, Search } from "lucide-react";
import { useMosque } from "../_lib/mock-mosque";
import type { HqMosque } from "@/app/api/crm/hq/mosques/route";

/**
 * Sahla HQ mosque switcher. Lets an HQ user pick any mosque and view/edit its
 * real CRM (backed by the `hq_active_mosque` cookie). "Sahla HQ Preview" clears
 * the selection. Only rendered for HQ users (see SidebarFooter).
 */
export default function MosquePicker() {
  const mosque = useMosque();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mosques, setMosques] = useState<HqMosque[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Lazy-load the mosque list the first time the menu opens.
  const loadMosques = useCallback(() => {
    if (mosques !== null) return;
    setLoading(true);
    fetch("/api/crm/hq/mosques")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { mosques: HqMosque[] }) => setMosques(d.mosques))
      .catch(() => setMosques([]))
      .finally(() => setLoading(false));
  }, [mosques]);

  const toggle = useCallback(() => {
    setOpen((v) => {
      const next = !v;
      if (next) loadMosques();
      return next;
    });
  }, [loadMosques]);

  const select = useCallback(
    async (mosqueId: string | null) => {
      setOpen(false);
      const res = mosqueId
        ? await fetch("/api/crm/hq/active-mosque", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mosqueId }),
          })
        : await fetch("/api/crm/hq/active-mosque", { method: "DELETE" });
      if (res.ok) {
        // Re-run the server layout so getCurrentMosque picks up the new cookie.
        startTransition(() => router.refresh());
      }
    },
    [router]
  );

  // The cookie selection only applies in the Sahla HQ context (preview or
  // viewing). If an HQ member has a real mosque org active, they're already
  // scoped to it — no picker.
  if (!mosque.isHQ && !mosque.isHQViewing) return null;

  const currentLabel = mosque.isHQViewing ? mosque.name : "Sahla HQ Preview";
  const filtered = (mosques ?? []).filter((m) =>
    `${m.name} ${m.city} ${m.state}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12.5px] text-[#fffbf2]/80 transition-colors hover:bg-white/[0.04] disabled:opacity-60"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/[0.08]">
          {mosque.isHQViewing ? (
            <Building2 size={12} strokeWidth={1.75} />
          ) : (
            <Eye size={12} strokeWidth={1.75} />
          )}
        </span>
        <span className="line-clamp-1 flex-1">{currentLabel}</span>
        <ChevronsUpDown size={13} className="shrink-0 text-[#fffbf2]/40" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-white/10 bg-[#0e2b22] shadow-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-2.5 py-2">
            <Search size={13} className="text-[#fffbf2]/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search masjids…"
              className="w-full bg-transparent text-[12.5px] text-[#fffbf2] placeholder:text-[#fffbf2]/35 focus:outline-none"
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => select(null)}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-[12.5px] text-[#fffbf2]/80 transition-colors hover:bg-white/[0.05]"
            >
              <Eye size={13} className="shrink-0 text-[#fffbf2]/50" />
              <span className="flex-1">Sahla HQ Preview</span>
              {!mosque.isHQViewing && <Check size={13} className="text-[#B8922A]" />}
            </button>

            <div className="my-1 h-px bg-white/[0.06]" />

            {loading && (
              <p className="px-2.5 py-2 text-[12px] text-[#fffbf2]/40">Loading masjids…</p>
            )}
            {!loading && filtered.length === 0 && (
              <p className="px-2.5 py-2 text-[12px] text-[#fffbf2]/40">No masjids found.</p>
            )}
            {filtered.map((m) => {
              const active = mosque.isHQViewing && mosque.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => select(m.id)}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <Building2 size={13} className="shrink-0 text-[#fffbf2]/50" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-[12.5px] text-[#fffbf2]">{m.name}</span>
                    {(m.city || m.state) && (
                      <span className="line-clamp-1 text-[11px] text-[#fffbf2]/45">
                        {[m.city, m.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </span>
                  {active && <Check size={13} className="shrink-0 text-[#B8922A]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
