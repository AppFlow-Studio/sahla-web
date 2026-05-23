/**
 * Mosque profile hook backed by the server-resolved `MosqueProvider`.
 *
 * Historically this file held a hard-coded `mockMosque` fixture so the
 * CRM UI could render before the backend was wired. The fixture is now
 * gone — the layout fetches the real mosque via `getCurrentMosque()`
 * and threads it through `<MosqueProvider>`. Every consumer that used
 * to call `useMosque()` keeps the same import path and shape.
 *
 * Re-export `MosqueProfile` so existing call sites don't need to change.
 */
export type { MosqueProfile } from "./getCurrentMosque";

import { useMosqueContext } from "../_components/MosqueProvider";
import type { MosqueProfile } from "./getCurrentMosque";

export function useMosque(): MosqueProfile {
  return useMosqueContext();
}
