/**
 * Motion vocabulary for the onboarding flow.
 *
 * Ease-out only. Onboarding is a task, not a showreel — motion here settles
 * into place to confirm state, it never bounces or overshoots. Durations stay
 * short enough that an admin filling out 15 tasks never waits on an animation.
 */

export const EASE_OUT_QUART: [number, number, number, number] = [0.25, 1, 0.5, 1];
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const DUR = {
  /** Instant acknowledgement — a number swapping, a badge appearing. */
  tick: 0.18,
  /** A state change the eye should follow — bar advancing, check landing. */
  state: 0.26,
  /** Something arriving on screen — the completion pill, the milestone card. */
  reveal: 0.42,
  /** Checkmark stroke draw. */
  draw: 0.34,
} as const;

/** Exits are ~75% of their entrance. */
export const EXIT = {
  duration: DUR.tick,
  ease: EASE_OUT_QUART,
} as const;

/** Celebration confetti — brand greens and golds, never rainbow. */
export const BURST_COLORS = ["#34D399", "#B8922A", "#0A261E", "#E8D5B0"] as const;

/**
 * Deterministic pseudo-random in [0,1). Particle scatter needs to look random
 * but stay identical across re-renders, so a seeded hash beats Math.random().
 */
export function scatter(i: number, seed: number): number {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
