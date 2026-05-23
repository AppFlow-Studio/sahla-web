"use client";

import { createContext, useContext } from "react";
import type { MosqueProfile } from "../_lib/getCurrentMosque";

const MosqueContext = createContext<MosqueProfile | null>(null);

export function MosqueProvider({
  mosque,
  children,
}: {
  mosque: MosqueProfile;
  children: React.ReactNode;
}) {
  return (
    <MosqueContext.Provider value={mosque}>{children}</MosqueContext.Provider>
  );
}

/**
 * Returns the mosque profile resolved by the (crm) server layout.
 * Throws when called outside the provider (i.e. outside a CRM page) —
 * surfaces wiring bugs early instead of silently falling back to mocks.
 */
export function useMosqueContext(): MosqueProfile {
  const ctx = useContext(MosqueContext);
  if (!ctx) {
    throw new Error(
      "useMosqueContext must be used inside <MosqueProvider> (i.e. within the (crm) tree)"
    );
  }
  return ctx;
}
