"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { INPUT_CLASS } from "@/lib/ui-classes";

export type SelectedPlace = {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
};

type Suggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
};

type Props = {
  /** Current street-address value (controlled). */
  value: string;
  /** Fires on every keystroke so the parent keeps the raw text in sync. */
  onChange: (value: string) => void;
  /** Fires once when the admin picks a place; carries the structured fields. */
  onSelect: (place: SelectedPlace) => void;
  placeholder?: string;
  className?: string;
};

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing the masjid's address…",
  className = INPUT_CLASS,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const sessionTokenRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Set when the admin picks a suggestion, so the resulting controlled-value
  // change doesn't immediately re-open the dropdown with a fresh query.
  const justSelectedRef = useRef(false);

  // Lazily start a billing session on first interaction; cleared after a pick.
  function ensureSessionToken(): string {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.round(performance.now())}`;
    }
    return sessionTokenRef.current;
  }

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced fetch whenever the typed value changes.
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: query,
            sessionToken: ensureSessionToken(),
          }),
        });
        if (!res.ok) throw new Error("autocomplete failed");
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
        setOpen((data.suggestions ?? []).length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  async function handlePick(s: Suggestion) {
    justSelectedRef.current = true;
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    onChange(s.primaryText); // optimistic — refined by details below
    setLoading(true);
    try {
      const res = await fetch("/api/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: s.placeId,
          sessionToken: sessionTokenRef.current,
        }),
      });
      if (!res.ok) throw new Error("details failed");
      const place = (await res.json()) as SelectedPlace;
      onSelect(place);
    } catch {
      // Keep the optimistic text if details lookup fails; the admin can edit.
    } finally {
      // Session ends on selection — next keystroke starts a fresh one.
      sessionTokenRef.current = null;
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      void handlePick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="address-autocomplete-list"
        aria-autocomplete="list"
      />
      {loading && (
        <Loader2
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-stone-400"
        />
      )}

      {open && suggestions.length > 0 && (
        <ul
          id="address-autocomplete-list"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void handlePick(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                  i === activeIndex ? "bg-stone-50" : "hover:bg-stone-50"
                }`}
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-stone-400" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-stone-900">
                    {s.primaryText}
                  </span>
                  {s.secondaryText && (
                    <span className="block truncate text-[12px] text-stone-500">
                      {s.secondaryText}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
