export type Donation = {
  id: string;
  /** Anonymized hash, no real PII */
  donorHash: string;
  amountUsd: number;
  /** ISO 8601 */
  occurredAt: string;
  status: "succeeded" | "refunded" | "pending";
  /** Optional fund destination */
  fundLabel: string;
  /** "card", "apple_pay", "google_pay", "ach" */
  method: "card" | "apple_pay" | "google_pay" | "ach";
};

const FUNDS = [
  "General Fund",
  "Sadaqah",
  "Building Fund",
  "Zakat",
  "Ramadan Iftar",
  "Refugee Aid",
];

const METHODS: Donation["method"][] = ["card", "apple_pay", "google_pay", "ach"];

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOW = new Date("2026-05-08T12:00:00Z").getTime();
const DAY = 86_400_000;

function build(): Donation[] {
  const r = rng(20260508);
  const out: Donation[] = [];

  // ~200 donations spread across the last 180 days, weighted recent
  const donorCount = 80;
  const donors = Array.from({ length: donorCount }, (_, i) =>
    `D${(i + 100).toString(36).toUpperCase().padStart(3, "0")}`
  );

  for (let i = 0; i < 220; i++) {
    const recencyBias = Math.pow(r(), 1.5); // closer to 0 = recent
    const daysAgo = Math.floor(recencyBias * 180);
    const occurredAt = new Date(NOW - daysAgo * DAY - Math.floor(r() * DAY)).toISOString();
    // Amount distribution: many small, fewer large
    const amountRoll = r();
    let amount: number;
    if (amountRoll < 0.45) amount = [10, 15, 20, 25][Math.floor(r() * 4)];
    else if (amountRoll < 0.85) amount = [50, 75, 100, 125][Math.floor(r() * 4)];
    else if (amountRoll < 0.97) amount = [200, 250, 500][Math.floor(r() * 3)];
    else amount = [1000, 1500, 2500, 5000][Math.floor(r() * 4)];

    const statusRoll = r();
    const status: Donation["status"] =
      statusRoll < 0.92 ? "succeeded" : statusRoll < 0.98 ? "refunded" : "pending";

    out.push({
      id: `don_${i.toString().padStart(4, "0")}`,
      donorHash: donors[Math.floor(r() * donorCount)],
      amountUsd: amount,
      occurredAt,
      status,
      fundLabel: FUNDS[Math.floor(r() * FUNDS.length)],
      method: METHODS[Math.floor(r() * METHODS.length)],
    });
  }

  return out.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}

export const seedDonations: Donation[] = build();
