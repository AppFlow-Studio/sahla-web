import { clerkClient } from "@clerk/nextjs/server";

/**
 * Push a mosque's logo image onto its Clerk organization so the Clerk
 * OrganizationSwitcher (and any org avatar Clerk renders) matches the app
 * branding instead of a generated placeholder.
 *
 * Best-effort: throws on failure so the caller can log; callers that shouldn't
 * block the user (e.g. the mosque PATCH route) should fire-and-forget with a
 * `.catch`. `uploaderUserId` must be a real Clerk user (Clerk credits the
 * upload to them) — pass the acting admin's id.
 */
export async function syncClerkOrgLogo(
  orgId: string,
  logoUrl: string,
  uploaderUserId: string
): Promise<void> {
  // A Clerk-hosted URL is already the org avatar — nothing to sync.
  if (logoUrl.includes("img.clerk.com")) return;

  const res = await fetch(logoUrl);
  if (!res.ok) throw new Error(`Failed to fetch logo (${res.status})`);
  const type = res.headers.get("content-type") || "image/png";
  const bytes = await res.arrayBuffer();
  const file = new File([bytes], "logo.png", { type });

  const client = await clerkClient();
  await client.organizations.updateOrganizationLogo(orgId, {
    file,
    uploaderUserId,
  });
}
