"use client";

import { useMemo } from "react";
import { seedDonations, type Donation } from "../_mock/donations";

export function useDonations() {
  const data = useMemo(() => seedDonations, []);
  return { data };
}

export type { Donation };
