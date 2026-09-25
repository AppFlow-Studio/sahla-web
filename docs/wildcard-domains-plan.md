# Wildcard domains (`*.sahla.co`) — setup plan

**Goal:** any masjid can get a website at `<slug>.sahla.co` without anyone
touching DNS or Vercel by hand. Later, masjids can also connect their own domain
(for example `isbr.org`). Both are served by the sahla-web project.

**Status (2026-09-24):** `isbr.sahla.co` ships as a single hardcoded subdomain
(PR #74). Nothing below has been done yet.

---

## Phase 0: Current DNS state (checked 2026-09-24)

- Registrar and DNS host: **GoDaddy** (`ns71/ns72.domaincontrol.com`)
- `sahla.co` A record → `216.198.79.1` (Vercel). `www` CNAME → Vercel
- ⚠️ **`crm.sahla.co` has no DNS record at all.** `next.config.ts`,
  `app/robots.ts` and the Clerk setup all assume it exists. Confirm whether
  it's meant to be live yet. After Phase 2 the wildcard would start serving it,
  which may or may not be what we want.

**Why the nameservers must move:** Vercel only issues a certificate for
`*.sahla.co` when Vercel runs the zone (the nameserver method). A CNAME at
GoDaddy covers single subdomains only.

## Phase 1: Move sahla.co DNS from GoDaddy to Vercel

Highest-risk step. A missing record here breaks **email** or **login**.
Keep the domain *registered* at GoDaddy and only change the nameservers.

### 1a. Copy every record into Vercel before switching

Export the full zone from GoDaddy (DNS → Export). The list below is what's
publicly resolvable, and the export may contain more. Every one of these must
exist in Vercel before the switch:

| Name | Type | Value | Used by |
|---|---|---|---|
| `@` | MX | `1 aspmx.l.google.com`, `5 alt1/alt2.aspmx.l.google.com`, `10 alt3/alt4.aspmx.l.google.com` | Google Workspace mail |
| `@` | TXT | `v=spf1 include:_spf.google.com ~all` ⚠️ see 1b | SPF |
| `@` | TXT | `google-site-verification=AS8pFnjxNicSedewhKOw7HxV5TrA2UcFp0JC7eQW9cU` | Search Console |
| `google._domainkey` | TXT | (copy exactly from GoDaddy, it's long) | Google DKIM |
| `_dmarc` | TXT | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:…` ⚠️ see 1b | DMARC |
| `clerk` | CNAME | `frontend-api.clerk.services` | Clerk auth (**login breaks without it**) |
| `accounts` | CNAME | `accounts.clerk.services` | Clerk account portal |
| `clkmail` | CNAME | `mail.ffzvc3u15ly3.clerk.services` | Clerk emails |
| `clk._domainkey` | CNAME | `dkim1.ffzvc3u15ly3.clerk.services` | Clerk DKIM |
| `clk2._domainkey` | CNAME | `dkim2.ffzvc3u15ly3.clerk.services` | Clerk DKIM |
| `send` | MX | `10 feedback-smtp.us-east-1.amazonses.com` | Resend |
| `send` | TXT | `v=spf1 include:amazonses.com ~all` ⚠️ see 1b | Resend SPF |
| `resend._domainkey` | TXT | (copy exactly from GoDaddy) | Resend DKIM |
| `@`, `www` | — | Created automatically by Vercel for the project | Website |

Leave out `_domainconnect` (GoDaddy-only).

### 1b. GoDaddy-specific records to rewrite

- **SPF:** the root SPF currently points at `dc-aa8e722993._spfm.sahla.co`, and
  `send` points at `dc-fd741b8612._spfm.send.sahla.co`. These are GoDaddy's
  "SPF manager" records and **stop working once GoDaddy no longer runs the DNS**.
  In Vercel, write the real values directly (shown in the table above) and
  don't copy the `_spfm` records.
- **DMARC `rua`:** currently sends reports to `dmarc_rua@onsecureserver.net`, a
  GoDaddy mailbox. Point it at an address we own (for example
  `dmarc@sahla.co`), or drop `rua`.

### 1c. Cutover

1. **At least 24h before:** lower TTLs on the GoDaddy records to 600s.
2. Add `sahla.co` to the Vercel team (it may already be there) and add every
   record from 1a/1b. Don't touch GoDaddy's zone. It's the fallback.
3. GoDaddy → sahla.co → Nameservers → custom → `ns1.vercel-dns.com`,
   `ns2.vercel-dns.com`.
4. Check the new records against Vercel's nameservers directly (this works before propagation finishes):
   ```bash
   for n in sahla.co clerk.sahla.co accounts.sahla.co clkmail.sahla.co send.sahla.co; do
     dig +short @ns1.vercel-dns.com $n ANY
   done
   dig +short @ns1.vercel-dns.com MX sahla.co
   ```
5. Once propagated: send a test email both ways (Gmail), sign in to the app
   (Clerk), trigger a Clerk email (password reset), and send a Resend email.
   Check DKIM/SPF pass in the received message headers.

**Rollback:** switch the nameservers back to `ns71/ns72.domaincontrol.com`.
The GoDaddy zone stays untouched, so this is a full revert (limited by TTLs).

## Phase 2: Add the wildcard to the project

1. Vercel → sahla-web → Settings → Domains → add `*.sahla.co`.
2. Vercel issues the wildcard certificate automatically.
3. Specific subdomains (`clerk`, `accounts`, `send`, `www`, `isbr`, …) keep
   working. An explicit DNS record or project domain always beats the wildcard.
4. From here on, **every** unknown `*.sahla.co` hits sahla-web. Right now that
   means the Sahla marketing site. Phase 3 changes that.

## Phase 3: Route by hostname in the app

### Hostname rules (in `proxy.ts`)

```
sahla.co, www.sahla.co, localhost          → Sahla marketing + app (today's logic)
crm.sahla.co                               → Sahla app (today's logic)
<slug>.sahla.co  (slug not reserved)       → masjid site for <slug>
<anything else, not ending in .sahla.co>   → masjid site, looked up by custom domain
```

- **Reserved subdomains** that can never be a masjid slug: `www`, `crm`,
  `app`, `api`, `admin`, `clerk`, `accounts`, `clkmail`, `send`, `mail`,
  `docs`, `blog`, `status`, `staging`, `dev`. Keep the list in one module
  shared by the proxy and the slug validator.
- Masjid-site hosts **skip Clerk routing entirely**, as the ISBR host does
  today. Sahla's Clerk cookie can be scoped to `*.sahla.co`, so without this a signed-in
  HQ admin would be redirected to `/overview`.
- Rewrite (not redirect) to an internal path:
  `ramadan.sahla.co/about` → `/sites/ramadan/about`. Pass the tenant ID along
  in a request header set by the proxy, and **delete that header from incoming
  requests first** so visitors can't spoof it.
- Block direct access to `/sites/*` on the Sahla hosts (404).
- Local dev: `<slug>.localhost:3000` works in Chrome without any setup.

### Route structure: needs a root-layout split

`app/layout.tsx` wraps everything in `ClerkProvider`, Sahla fonts, Sahla
metadata (`%s | Sahla`) and Sahla JSON-LD. Masjid sites must not inherit any
of that. So:

1. Move today's routes and `app/layout.tsx` into `app/(sahla)/` (URLs don't
   change; route groups don't affect paths).
2. Add `app/(sites)/sites/[site]/layout.tsx` as a **second root layout**
   (its own `<html>`, fonts, metadata, no Clerk). Not `_sites`: folders starting with `_` are private and never become routes.
3. `robots.ts` / `sitemap.ts` need to branch on the host. Each masjid site
   gets its own robots and sitemap pointing at its own URL.

This is the largest code change. Do it as its own PR with no behavior change,
then build the sites on top.

### Rendering and caching

- Pages are server components that load the site config and content from
  Supabase by slug.
- Cache per site (`"use cache"` + `cacheTag(\`site:${siteId}\`)`) and call
  `revalidateTag` when a masjid publishes from the builder, so pages don't
  hit the DB on every request.
- Unknown slug → a neutral "site not found" page. Never show the Sahla
  marketing 404 on a masjid host.

## Phase 4: Data model (Supabase)

`masjid_sites` table (first draft):

| column | notes |
|---|---|
| `id` | uuid pk |
| `masjid_id` | fk to the existing masjid/org record |
| `subdomain` | unique, lowercase, `^[a-z0-9](-?[a-z0-9])*$`, 3–40 chars, not in the reserved list |
| `custom_domain` | unique, nullable |
| `custom_domain_status` | `pending` / `verified` / `error` |
| `status` | `draft` / `published` / `suspended` |
| `theme`, `content` | jsonb, owned by the website builder |
| `published_at`, `updated_at` | |

RLS: anyone can read `published` rows. Only the masjid's own admins can
write. Hostname lookup runs in the proxy on every request, so keep it cheap
(indexed columns, cached lookup, or an Edge/Global Config map synced from the
table).

## Phase 5: Masjids connecting their own domains

1. Masjid enters `isbr.org` in the CRM. Save it as `pending`.
2. Server calls the Vercel API: `vercel.projects.addProjectDomain({ idOrName:
   "sahla-web", requestBody: { name: "isbr.org" } })`, using a
   `VERCEL_TOKEN` scoped to the team.
3. Show the masjid the DNS records to add, taken from the API response
   (a CNAME for `www`/subdomains, A records for the apex, plus a TXT
   verification record if the domain is already used on another Vercel account).
4. Poll `GET /v6/domains/{domain}/config` (or a cron job) until it's configured, then
   mark it `verified`. Vercel issues the certificate automatically.
5. On removal: call `removeProjectDomain` and clear the column.

Check the Vercel plan's per-project domain limit before launch. Vercel for
Platforms has guidance if we get close to it.

## Phase 6: Move ISBR onto the platform

Once Phase 3–4 exist, recreate ISBR as a `masjid_sites` row and delete:
the `prebuild`/`build:isbr` scripts, the ISBR rewrites in `next.config.ts`,
`ISBR_HOST_RE` in `proxy.ts`, and the `isbr-site/` folder. `isbr.sahla.co`
then comes from the wildcard like every other site.

---

## Order of work

1. Phase 0 check on `crm.sahla.co` (decide intent).
2. Phase 1 DNS move, scheduled at a quiet time with someone watching email and login.
3. Phase 2 wildcard in Vercel (5 minutes).
4. Phase 3 root-layout split PR (no behavior change).
5. Phase 3 host routing + Phase 4 table, behind a hardcoded test slug.
6. Website builder UI writes to `masjid_sites`.
7. Phase 5 custom domains.
8. Phase 6 ISBR migration.
