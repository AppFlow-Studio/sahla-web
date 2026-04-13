// Shared UI class strings used across both admin and masjid panels.
// Keep these in sync — variants below are intentional (form-row vs full-page primary).

export const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-stone-200 bg-white px-4 text-sm text-stone-900 shadow-sm outline-none transition-colors placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-100";

export const LABEL_CLASS =
  "mb-1.5 block text-[12px] font-semibold text-stone-700";

// Page-level primary action (larger).
export const BTN_PRIMARY =
  "rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 inline-flex items-center gap-2";

// In-form primary action (smaller, for embedded "Add X" buttons).
export const BTN_PRIMARY_SM =
  "rounded-lg bg-stone-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 inline-flex items-center gap-2";

export const BTN_PRIMARY_DISABLED =
  "rounded-lg bg-stone-100 px-5 py-2.5 text-sm font-medium text-stone-400 cursor-not-allowed";

export const BTN_GHOST =
  "rounded-lg px-4 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700";

export const BTN_GHOST_SM =
  "rounded-lg px-4 py-2 text-[13px] font-medium text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700";

export const CARD = "rounded-xl border border-stone-200 bg-white shadow-sm";
