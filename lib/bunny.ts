/**
 * Bunny.net Edge Storage helper (server-side)
 * -------------------------------------------
 * Thin wrapper around the Bunny Edge Storage HTTP API so Next.js route
 * handlers can upload image files to the same `sahla-co` storage zone the
 * mobile app / Supabase edge functions use. Files are served publicly through
 * the `sahla.b-cdn.net` pull zone.
 *
 * ⚠️  SERVER-SIDE ONLY.
 * Uses the storage-zone AccessKey (password), which is a SECRET. Never import
 * this into a client component and never expose the key via NEXT_PUBLIC_*.
 *
 * Mirrors the app-side `supabase/functions/_shared/bunny-storage.ts`, but talks
 * to the raw HTTP API (https://docs.bunny.net/reference/storage-api) instead of
 * the Deno SDK so there's no extra dependency in the web app.
 *
 * Required env (server-only):
 *   BUNNY_STORAGE_ZONE     storage zone name                e.g. "sahla-co"
 *   BUNNY_STORAGE_KEY      storage zone password/AccessKey  (SECRET)
 *   BUNNY_STORAGE_REGION   region code; "" = default DE zone e.g. "ny"
 *   BUNNY_PULL_ZONE_HOST   public CDN hostname              e.g. "sahla.b-cdn.net"
 */

const ZONE = process.env.BUNNY_STORAGE_ZONE ?? "";
const KEY = process.env.BUNNY_STORAGE_KEY ?? "";
const REGION = process.env.BUNNY_STORAGE_REGION ?? "";
const PULL_ZONE_HOST = process.env.BUNNY_PULL_ZONE_HOST ?? "";

/** Storage API host — region-prefixed, or the default DE (Falkenstein) host. */
function storageHost(): string {
  return REGION ? `${REGION}.storage.bunnycdn.com` : "storage.bunnycdn.com";
}

/** Strip leading slashes so path segments join cleanly. */
function clean(path: string): string {
  return path.replace(/^\/+/, "");
}

/** Throws if required config is missing — call at the top of a handler. */
export function assertBunnyConfigured(): void {
  const missing = [
    ["BUNNY_STORAGE_ZONE", ZONE],
    ["BUNNY_STORAGE_KEY", KEY],
    ["BUNNY_PULL_ZONE_HOST", PULL_ZONE_HOST],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `Bunny storage not configured — missing env: ${missing.join(", ")}`
    );
  }
}

/**
 * Public, CDN-served URL for a stored file — this is what gets persisted on the
 * row and rendered by the mobile app. No AccessKey needed.
 */
export function bunnyPublicUrl(path: string): string {
  return `https://${PULL_ZONE_HOST}/${clean(path)}`;
}

/**
 * Upload (create or overwrite) a file to the storage zone; returns its public
 * CDN URL. `path` is the key within the zone, e.g. `logos/{mosqueId}/logo.png`.
 */
export async function uploadToBunny(
  path: string,
  file: File,
  contentType?: string
): Promise<string> {
  assertBunnyConfigured();
  const key = clean(path);
  const res = await fetch(
    `https://${storageHost()}/${ZONE}/${key}`,
    {
      method: "PUT",
      headers: {
        AccessKey: KEY,
        "Content-Type": contentType || file.type || "application/octet-stream",
      },
      body: await file.arrayBuffer(),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Bunny upload failed (${res.status})${body ? `: ${body}` : ""}`
    );
  }
  return bunnyPublicUrl(key);
}

/** Delete a file from the storage zone. Best-effort; throws on API error. */
export async function deleteFromBunny(path: string): Promise<void> {
  assertBunnyConfigured();
  const res = await fetch(
    `https://${storageHost()}/${ZONE}/${clean(path)}`,
    { method: "DELETE", headers: { AccessKey: KEY } }
  );
  // 404 = already gone; treat as success.
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Bunny delete failed (${res.status})${body ? `: ${body}` : ""}`
    );
  }
}
