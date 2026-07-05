import { Suspense } from "react";
import BackupCardClient from "./BackupCardClient";

export const metadata = {
  title: "Add a backup card · Sahla",
};

export default function BackupCardPage() {
  return (
    <Suspense fallback={null}>
      <BackupCardClient />
    </Suspense>
  );
}
