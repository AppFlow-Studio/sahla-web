"use client";

import { useMemo } from "react";
import { seedMembers, type Member } from "../_mock/members";

/**
 * Members are read-only from the CRM's perspective — they sign up via the
 * mosque app, not from inside the admin tool. Backend pass swaps the seed
 * for a Supabase query against `profiles` joined to mosque membership.
 */
export function useMembers() {
  // Stable reference; would be a query in real life.
  const data = useMemo(() => seedMembers, []);
  return { data };
}

export type { Member };
