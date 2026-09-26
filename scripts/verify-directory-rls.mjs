/**
 * One-off verification for SAHLA-WEB-12: proves the masjids_directory RLS
 * policy actually hides opted_out rows from public (anon) reads, using the
 * real database rather than a unit test mock. Inserts a throwaway row via
 * the service role, reads it back with the anon key, flips opted_out, reads
 * again, then deletes the row it created either way.
 *
 *   node --env-file=.env scripts/verify-directory-rls.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

const slug = `rls-check-${Date.now()}`;

async function main() {
  let ok = true;

  const { data: inserted, error: insertErr } = await admin
    .from("masjids_directory")
    .insert({ slug, name: "RLS Verification Row", city: "New York", state: "NY" })
    .select("id")
    .single();
  if (insertErr) throw new Error(`insert failed: ${insertErr.message}`);
  const id = inserted.id;

  try {
    const { data: visibleRow } = await anon.from("masjids_directory").select("id, opted_out").eq("id", id).maybeSingle();
    const step1 = visibleRow != null;
    console.log(step1 ? "PASS" : "FAIL", "- anon can read a non-opted-out row");
    ok &&= step1;

    // Postgres RLS doesn't error on a blocked UPDATE — a row the USING clause
    // excludes just isn't matched, so this silently affects 0 rows. Proving
    // the write was blocked means re-reading the row via the service role
    // and confirming it's unchanged, not checking for a thrown error.
    await anon.from("masjids_directory").update({ name: "hacked" }).eq("id", id);
    const { data: afterWrite } = await admin.from("masjids_directory").select("name").eq("id", id).single();
    const step2 = afterWrite?.name !== "hacked";
    console.log(step2 ? "PASS" : "FAIL", "- anon cannot write (row unchanged after anon update attempt)");
    ok &&= step2;

    const { error: optOutErr } = await admin.from("masjids_directory").update({ opted_out: true }).eq("id", id);
    if (optOutErr) throw new Error(`opt-out update failed: ${optOutErr.message}`);

    const { data: hiddenRow } = await anon.from("masjids_directory").select("id").eq("id", id).maybeSingle();
    const step3 = hiddenRow == null;
    console.log(step3 ? "PASS" : "FAIL", "- anon can no longer see the row once opted_out = true");
    ok &&= step3;

    const { data: stillVisibleToAdmin } = await admin.from("masjids_directory").select("id").eq("id", id).maybeSingle();
    const step4 = stillVisibleToAdmin != null;
    console.log(step4 ? "PASS" : "FAIL", "- service role can still see the opted-out row");
    ok &&= step4;
  } finally {
    await admin.from("masjids_directory").delete().eq("id", id);
  }

  console.log(ok ? "\nAll RLS checks passed." : "\nSome RLS checks FAILED.");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("Verification failed:", err.message ?? err);
  process.exit(1);
});
