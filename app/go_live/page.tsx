import { Suspense } from "react";
import GoLiveClient from "./GoLiveClient";

export const metadata = {
  title: "Setting up your CRM · Sahla",
};

export default function GoLivePage() {
  return (
    <Suspense fallback={null}>
      <GoLiveClient />
    </Suspense>
  );
}
