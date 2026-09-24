import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveLaunchDestination } from "@/lib/auth/launch-destination";
import LaunchHandoff from "./LaunchHandoff";

export const metadata: Metadata = {
  title: "Opening Sahla",
  robots: { index: false, follow: false },
};

/**
 * The single "take me where I belong" route. Reached after sign-in, after
 * picking an organization, and from every org switcher in the product.
 *
 * It used to be a proxy-level redirect with nothing to render. It renders now
 * because the answer differs per session, and naming the destination out loud
 * beats a blank screen followed by a page the admin didn't ask for.
 */
export default async function LaunchPage() {
  const dest = await resolveLaunchDestination();

  // Nothing to hand off to — the sign-in page is the destination itself.
  if (dest.kind === "signed-out") redirect("/login");

  return <LaunchHandoff dest={dest} />;
}
