"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

/**
 * Opens the mosque's Stripe billing portal — where they can switch plans (e.g.
 * Core → Core + CRM), update cards, or cancel. Auth-only, so it works for
 * mosques whose plan doesn't include the CRM.
 */
export default function BillingPortalButton({
  mosqueId,
  label = "Upgrade to Core + CRM",
  className = "",
}: {
  mosqueId: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/stripe/billing-portal`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Couldn't open billing");
      window.location.href = body.url;
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "Couldn't open billing"
          ? `${err.message} — email support@sahla.co and we'll switch you over.`
          : "Couldn't open billing — email support@sahla.co and we'll switch you over."
      );
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={openPortal} disabled={loading} className={className}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
        {loading ? "Opening billing…" : label}
      </button>
      {error && (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
