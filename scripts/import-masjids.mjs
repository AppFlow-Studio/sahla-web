/**
 * Import masjids into the public directory (`masjids_directory` table), SAHLA-WEB-12.
 *
 * Every imported row starts as verification_status = 'unverified' — nothing
 * this script does can mark a masjid 'masjid_confirmed'. That flag is only
 * ever set by hand once the masjid itself confirms its times (see
 * lib/masjid-directory/publish-rules.ts, which is what actually gates the
 * "Verified" label — not this script).
 *
 * Input is a JSON array of objects. Required: name, city, state. Optional:
 * name_ar, address, zip, lat, lng, phone, website, email, calculation_method,
 * school, data_source, slug (auto-generated from name + city if omitted).
 *
 * Dry-run by default (prints what it would upsert). Pass --apply to write.
 * Upserts on `slug`, so re-running with corrected data is safe.
 *
 * Refuses to --apply rows whose name contains "PLACEHOLDER" (the shape of
 * scripts/data/masjids-import.sample.json) unless --allow-placeholder is
 * also passed — a guard against ever writing sample data into the real
 * directory that people will use to find prayer times.
 *
 *   cd sahla-web
 *   node --env-file=.env scripts/import-masjids.mjs <path-to-json>            # preview
 *   node --env-file=.env scripts/import-masjids.mjs <path-to-json> --apply    # write
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ALLOW_PLACEHOLDER = args.includes("--allow-placeholder");
const filePath =
  args.find((a) => !a.startsWith("--")) ?? "scripts/data/masjids-import.sample.json";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toRow(raw, index) {
  const errors = [];
  if (!raw.name?.trim()) errors.push("missing name");
  if (!raw.city?.trim()) errors.push("missing city");
  if (!raw.state?.trim()) errors.push("missing state");

  const slug = raw.slug?.trim() || slugify(`${raw.name ?? "masjid"}-${raw.city ?? ""}`) || `masjid-${index}`;

  return {
    errors,
    isPlaceholder: /placeholder/i.test(raw.name ?? ""),
    row: {
      slug,
      name: raw.name ?? null,
      name_ar: raw.name_ar ?? null,
      address: raw.address ?? null,
      city: raw.city ?? null,
      state: raw.state ?? null,
      zip: raw.zip ?? null,
      lat: raw.lat ?? null,
      lng: raw.lng ?? null,
      phone: raw.phone ?? null,
      website: raw.website ?? null,
      email: raw.email ?? null,
      calculation_method: raw.calculation_method ?? 2,
      school: raw.school ?? 0,
      is_sahla_customer: false,
      mosque_id: null,
      verification_status: "unverified",
      last_verified_at: null,
      verified_by: null,
      data_source: raw.data_source ?? "manual_import",
      opted_out: false,
    },
  };
}

async function main() {
  console.log(`\nImport masjids — ${APPLY ? "APPLY (writing)" : "DRY RUN (no writes)"}`);
  console.log(`Source: ${filePath}\n`);

  const raw = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(raw)) throw new Error("Input file must be a JSON array");

  const parsed = raw.map(toRow);
  const valid = parsed.filter((p) => p.errors.length === 0);
  const invalid = parsed.filter((p) => p.errors.length > 0);
  const placeholders = valid.filter((p) => p.isPlaceholder);

  for (const p of invalid) {
    console.warn(`  ! skipping row — ${p.errors.join(", ")}: ${JSON.stringify(p.row.name)}`);
  }

  if (placeholders.length > 0 && APPLY && !ALLOW_PLACEHOLDER) {
    console.error(
      `\nRefusing to --apply: ${placeholders.length} row(s) look like placeholder/sample data ` +
        `(name contains "PLACEHOLDER"). Pass --allow-placeholder if this is intentional.\n`
    );
    process.exit(1);
  }

  const slugCounts = new Map();
  for (const p of valid) slugCounts.set(p.row.slug, (slugCounts.get(p.row.slug) ?? 0) + 1);
  const duplicateSlugs = [...slugCounts.entries()].filter(([, n]) => n > 1);
  if (duplicateSlugs.length > 0) {
    console.warn(
      `\n  ! ${duplicateSlugs.length} duplicate slug(s) in the input — later rows will overwrite earlier ones on upsert:`
    );
    for (const [slug, n] of duplicateSlugs) console.warn(`    - ${slug} (${n}x)`);
  }

  console.log(`\nParsed ${raw.length} row(s): ${valid.length} valid, ${invalid.length} skipped.`);

  if (!APPLY) {
    console.log("\nSample of what would be upserted:");
    for (const p of valid.slice(0, 5)) {
      console.log(`  · ${p.row.slug} — ${p.row.name}, ${p.row.city}, ${p.row.state}`);
    }
    console.log("\nRun with --apply to write. (Dry run made no changes.)\n");
    return;
  }

  const rows = valid.map((p) => p.row);
  const { data, error } = await supabase
    .from("masjids_directory")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug");

  if (error) throw new Error(`upsert failed: ${error.message}`);

  console.log(`\nDone. Upserted ${data?.length ?? 0} masjid(s), all as verification_status = 'unverified'.\n`);
}

main().catch((err) => {
  console.error("\nImport failed:", err.message ?? err);
  process.exit(1);
});
