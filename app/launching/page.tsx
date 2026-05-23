import { Suspense } from "react";
import LaunchingClient from "./LaunchingClient";

export const metadata = {
  title: "Setting up your CRM · Sahla",
};

export default function LaunchingPage() {
  return (
    <Suspense fallback={null}>
      <LaunchingClient />
    </Suspense>
  );
}
