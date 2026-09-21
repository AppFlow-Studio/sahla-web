"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Language picker for the CRM top bar.
 *
 * The mosque CRM is read by people whose first language often isn't English, so
 * the control is deliberately visible rather than buried in settings.
 *
 * IMPORTANT: this stores a preference — it does NOT translate the interface yet.
 * No translation layer exists in the app, so every language other than English is
 * marked "Coming soon" and cannot be selected. Showing a picker that silently did
 * nothing would be worse than showing an honest one. When an i18n pass lands, drop
 * `available: false` and read `LANGUAGE_STORAGE_KEY` to pick the locale.
 */

export const LANGUAGE_STORAGE_KEY = "sahla-crm-language";

/**
 * Tiny store so the chosen language survives a reload.
 *
 * `useSyncExternalStore` rather than reading storage in an effect: it renders the
 * server snapshot ("en") during hydration and swaps to the stored value straight
 * after, so the label can never cause a hydration mismatch. A plain `useState` +
 * effect would both trip the set-state-in-effect rule and risk that mismatch.
 * The `storage` event only fires in OTHER tabs, so local writes notify listeners
 * directly.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredLanguage(): string {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved && LANGUAGES.some((l) => l.code === saved && l.available) ? saved : "en";
  } catch {
    // Private browsing or blocked storage — English is a fine default.
    return "en";
  }
}

function serverLanguage(): string {
  return "en";
}

function storeLanguage(code: string): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // Preference just won't persist; the session still works.
  }
  for (const l of listeners) l();
}

type Language = {
  code: string;
  /** How the language names itself — what a speaker actually scans for. */
  native: string;
  english: string;
  available: boolean;
};

export const LANGUAGES: Language[] = [
  { code: "en", native: "English", english: "English", available: true },
  { code: "ar", native: "العربية", english: "Arabic", available: false },
  { code: "ur", native: "اردو", english: "Urdu", available: false },
  { code: "bn", native: "বাংলা", english: "Bengali", available: false },
  { code: "so", native: "Soomaali", english: "Somali", available: false },
  { code: "tr", native: "Türkçe", english: "Turkish", available: false },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const code = useSyncExternalStore(subscribe, readStoredLanguage, serverLanguage);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

  function choose(lang: Language) {
    if (!lang.available) return;
    setOpen(false);
    storeLanguage(lang.code);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Language: ${current.english}. Change language`}
        className="flex h-10 items-center gap-2 rounded-full border border-[#0A261E]/[0.07] bg-white px-3.5 text-[13px] font-medium text-[#0A261E]/75 shadow-[0_2px_8px_-2px_rgba(10,38,30,0.10),0_1px_2px_rgba(10,38,30,0.05)] transition-colors hover:text-[#0A261E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mosque-accent,#B8922A)]/40"
      >
        <Globe size={15} strokeWidth={2} className="shrink-0 text-[#0A261E]/50" />
        <span className="hidden sm:inline">{current.native}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.25}
          className={cn(
            "shrink-0 text-[#0A261E]/45 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Choose a language"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-[#0A261E]/10 bg-white py-1.5 shadow-[0_16px_40px_-12px_rgba(10,38,30,0.28)]"
        >
          {LANGUAGES.map((lang) => {
            const selected = lang.code === code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={!lang.available}
                onClick={() => choose(lang)}
                className={cn(
                  "flex w-full items-center gap-3 px-3.5 py-2 text-left text-[13.5px] transition-colors",
                  lang.available
                    ? "text-[#0A261E] hover:bg-[#0A261E]/[0.04]"
                    : "cursor-not-allowed text-[#0A261E]/40"
                )}
              >
                <span className="flex-1">
                  <span className="block">{lang.native}</span>
                  {lang.native !== lang.english ? (
                    <span className="block text-[11.5px] text-[#0A261E]/55">
                      {lang.english}
                    </span>
                  ) : null}
                </span>
                {selected ? (
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="shrink-0 text-[var(--mosque-accent,#B8922A)]"
                  />
                ) : !lang.available ? (
                  <span className="shrink-0 rounded-full bg-[#0A261E]/[0.05] px-2 py-0.5 text-[10.5px] font-medium text-[#0A261E]/55">
                    Coming soon
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
