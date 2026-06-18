/** Format an ISO date as a short relative string ("2d", "3h", "now"). */
export function relativeShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 8) return `${wk}w ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Mask an email for the privacy-first members table — "j***@gmail.com". */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 1, 3))}@${domain}`;
}

/** Format dollars: 1234 → "$1,234" */
export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Cents → "$50.00", respecting the (lowercase ISO) currency code. */
export function formatMoneyCents(
  cents: number,
  currency: string | null = "usd"
): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: (currency ?? "usd").toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** ISO → "Jun 18, 2026" (or "—" when missing/invalid). */
export function fullDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Human-readable elapsed time since `iso`, rounded to the largest sensible
 * unit ("3 days", "5 weeks", "2 months", "1 year"). Used for "subscribed for …".
 */
export function durationSince(iso: string | null | undefined): string {
  if (!iso) return "—";
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return "—";
  const days = Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
  if (days < 1) return "today";
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 60) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days % 365) / 30);
  return remMonths > 0
    ? `${years} ${years === 1 ? "year" : "years"} ${remMonths} mo`
    : `${years} ${years === 1 ? "year" : "years"}`;
}
