/**
 * Mock mosque profile so the CRM shell renders something believable
 * without depending on the auth/data layer. Replace with `useMosque()`
 * pulling from Clerk + Supabase in the backend pass.
 */
export type MosqueProfile = {
  id: string;
  name: string;
  city: string;
  state: string;
  tier: "core" | "core_crm" | "complete";
  primaryColor: string;
  accentColor: string;
  logoInitials: string;
};

export const mockMosque: MosqueProfile = {
  id: "mosque_demo_hamoudeh",
  name: "Masjid Hamoudeh",
  city: "Brooklyn",
  state: "NY",
  tier: "core_crm",
  primaryColor: "#0A261E",
  accentColor: "#B8922A",
  logoInitials: "MH",
};

export function useMosque(): MosqueProfile {
  return mockMosque;
}
