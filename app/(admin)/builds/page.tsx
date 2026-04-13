import BuildsClient from "./BuildsClient";
import { APPS } from "./data";

export default function BuildsPage() {
  return (
    <div>
      <BuildsClient apps={APPS} />
    </div>
  );
}
