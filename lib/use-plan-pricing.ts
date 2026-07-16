"use client";

import { useEffect, useState } from "react";
import type { PlanPricing } from "@/lib/pricing";

/**
 * Fetches live plan prices from /api/pricing. Returns null until loaded so
 * callers can render a skeleton and avoid flashing a stale hardcoded amount.
 */
export function usePlanPricing(): PlanPricing | null {
  const [pricing, setPricing] = useState<PlanPricing | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setPricing(data as PlanPricing);
      })
      .catch(() => {
        // Leave as null; callers fall back to their static copy.
      });
    return () => {
      alive = false;
    };
  }, []);

  return pricing;
}
