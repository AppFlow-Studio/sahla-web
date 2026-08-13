import "server-only";

import { checkBotId } from "botid/server";

/**
 * Lean, layered bot protection for Sahla's public form endpoints.
 *
 * Three cheap, independent layers guard a submission before it does any work
 * (DB writes, emails):
 *   1. Content-type — the browser fetch always sends JSON; anything else is a
 *      script poking the endpoint directly.
 *   2. Origin — when the browser sends an Origin header it must be one of ours.
 *   3. Honeypot — a hidden field real users never see; bots that autofill it
 *      out themselves.
 *   4. Vercel BotID — invisible attestation verified server-side.
 *
 * BotID only functions on Vercel (it relies on the edge injecting the client
 * script). Locally checkBotId() reports isBot=false, so developers are never
 * blocked, and provider errors fail open so an outage never takes the form down.
 */

/** Hidden field name the client renders as a honeypot. Kept plausible so
 *  autofill/scraper bots are tempted to fill it. */
export const HONEYPOT_FIELD = "companyWebsite" as const;

/** Origins allowed to POST to the form APIs. Extend via NEXT_PUBLIC_APP_URL and
 *  Vercel's per-deployment URLs so previews keep working. */
const ALLOWED_ORIGINS = new Set<string>(
  [
    "https://sahla.co",
    "https://www.sahla.co",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_BRANCH_URL
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : undefined,
  ].filter((origin): origin is string => Boolean(origin)),
);

/** True when the request body is declared as JSON. */
export function isJsonRequest(request: Request): boolean {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.startsWith("application/json");
}

/**
 * True when the request's Origin is trusted. A missing Origin header is
 * allowed — same-origin navigations and non-CORS clients legitimately omit it,
 * and the other layers still apply. localhost is always allowed for dev.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (ALLOWED_ORIGINS.has(parsed.origin)) return true;
  return ["localhost", "127.0.0.1"].includes(parsed.hostname);
}

/** True when the honeypot field was filled — a strong bot signal. */
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

export type HumanVerdict = "human" | "bot" | "unknown";

/**
 * Verify the caller against Vercel BotID. Returns "bot" only on a definitive
 * classification; provider/network errors return "unknown" so callers can fail
 * open and never block a real submission because of an outage.
 */
export async function verifyHuman(): Promise<HumanVerdict> {
  try {
    const result = await checkBotId({
      advancedOptions: { checkLevel: "basic" },
    });
    return result.isBot ? "bot" : "human";
  } catch {
    return "unknown";
  }
}
