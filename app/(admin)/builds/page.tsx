import BuildsClient from "./BuildsClient";
import { fetchAppBuilds } from "./data";

export const dynamic = "force-dynamic";

export default async function BuildsPage() {
  const apps = await fetchAppBuilds();
  return (
    <div>
      <BuildsClient apps={apps} />
    </div>
  );
}
