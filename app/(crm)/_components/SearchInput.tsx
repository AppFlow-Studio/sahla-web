"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Wrapper classes — use for layout (e.g. "max-w-md flex-1"). */
  className?: string;
  /** Extra classes forwarded to the underlying input. */
  inputClassName?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
};

/**
 * Standard CRM search field: leading magnifier, a clear (×) button that
 * appears once there's a query, and the shared focus ring. The icon deepens
 * on focus so the whole control reads as one element. Native WebKit search
 * cancel is suppressed so the clear affordance is consistent cross-browser.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  inputClassName,
  autoFocus,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  return (
    <div className={cn("group relative", className)}>
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40 transition-colors group-focus-within:text-[#0A261E]/70"
      />
      <Input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "pl-9 [&::-webkit-search-cancel-button]:appearance-none",
          value ? "pr-8" : "pr-2.5",
          inputClassName
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-[#0A261E]/40 transition-colors hover:bg-[#0A261E]/[0.06] hover:text-[#0A261E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A261E]/20"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}
