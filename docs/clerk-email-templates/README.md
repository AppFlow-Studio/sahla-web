# Clerk email templates

Clerk's dashboard has its own email templating system — **not raw HTML**.
It uses a proprietary DSL of `<re-*>` components (React Email-style):
`<re-html>`, `<re-body>`, `<re-header>`, `<re-main>`, `<re-block>`,
`<re-heading>`, `<re-text>`, `<re-button>`, etc. Variables use Handlebars
syntax (`{{org.name}}`, `{{action_url}}`, `{{#if inviter_name}}…{{/if}}`).

The files here are the source of truth for what we've pasted into Clerk.
When you need to change an email, edit the file, then re-paste into the
Clerk dashboard.

## Files

| File                                     | What it is                                              |
| ---------------------------------------- | ------------------------------------------------------- |
| `organization-invitation.clerk.html`     | HTML-body template in Clerk's DSL. **Paste this.**      |
| `organization-invitation.txt`            | Plain-text fallback for the same email.                 |

## organization-invitation.clerk.html

Sent whenever we call
`clerkClient.organizations.createOrganizationInvitation(...)` — i.e. when
a mosque admin invites a teammate from `/settings/team`, or when we
programmatically invite the initial mosque owner. The default template is
blank and off-brand.

### Install (~2 minutes)

1. Clerk dashboard → **Customization → Emails**
2. Select **Organization invitation** from the list
3. In the **Body** editor, click the **`</>`** icon in the top-right
   toolbar to switch to **HTML source mode**. (The WYSIWYG mode won't
   accept a paste with `<re-*>` tags cleanly.)
4. Select all → paste the entire contents of
   `organization-invitation.clerk.html`.
5. If there's a **Plain-text body** section further down, paste
   `organization-invitation.txt` there.
6. **Save**
7. Send yourself a test invite from `/settings/team` to confirm the
   render.

### Variables Clerk substitutes at send time

- `{{org.name}}` — the mosque org name (e.g. "Sahla Demo Masjid 01")
- `{{inviter_name}}` — the person sending the invite (may be empty; the
  template branches with `{{#if inviter_name}}`)
- `{{action_url}}` — the unique accept-invitation link
- `{{app.name}}` — "Sahla" (used in the `<re-title>`)

The header logo is a hardcoded `https://www.sahla.co/sahla-logo.png` —
same asset used by the Business Ad receipt in
`supabase/functions/stripe-webhooks/index.ts`. We intentionally don't use
`{{org.logo_image_url}}` here so a fresh mosque that hasn't uploaded a
logo yet doesn't get Clerk's auto-generated initials avatar in the
header. The org name still renders as text below the logo.

## Troubleshooting

- **"Body should contain the `{{action_url}}` variable"** — the field is
  probably empty (paste failed) or you pasted raw HTML (not Clerk DSL).
  Confirm the body has `<re-*>` tags visible in the editor. Re-paste in
  HTML-source mode.
- **Save button is disabled** — Clerk validates that all required
  variables are present. Check the Reset-to-Default sidebar for the list.
- **Preview shows raw `{{org.name}}`** — normal for preview mode; Clerk
  substitutes at send time. Send a real test invite.
- **The `re-*` tags look strange in the source view** — that's the
  intended editor experience. Clerk transforms them into standard HTML at
  send time.

## When you edit the template

1. Update `organization-invitation.clerk.html` in this repo (source of
   truth for review + version control).
2. Update `organization-invitation.txt` if the copy changed.
3. Re-paste into Clerk dashboard (step 3–6 above).
4. Commit the file change so the repo matches production.

## Reference

Clerk's docs for customizable email templates:
https://clerk.com/docs/customization/email-templates
