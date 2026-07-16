import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

/**
 * Guards an API route to Sahla HQ admins only. Returns a NextResponse to send
 * back (401/403) when the caller isn't HQ, or null when the request may proceed.
 */
export async function requireHQ(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!SAHLA_HQ_ORG_ID || session.orgId !== SAHLA_HQ_ORG_ID) {
    return NextResponse.json(
      { error: "Forbidden — Sahla HQ membership required" },
      { status: 403 }
    );
  }
  return null;
}
