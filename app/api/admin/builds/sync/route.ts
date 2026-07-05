import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncAppBuilds, getStoreConfigStatus } from "@/lib/appstore/storeSync";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

/** Store config status — lets the Builds tab show whether sync is wired. */
export async function GET() {
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
  return NextResponse.json({ stores: getStoreConfigStatus() });
}

/** Trigger a build sync across all ready/live mosque apps. */
export async function POST() {
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

  try {
    const summary = await syncAppBuilds();
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
