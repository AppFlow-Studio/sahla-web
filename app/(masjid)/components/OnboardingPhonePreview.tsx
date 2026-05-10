"use client";

import { usePreview } from "./OnboardingPreviewContext";
import AppPreviewPanel from "@/components/ui/skiper-ui/AppPreviewPanel";

export default function OnboardingPhonePreview() {
  const { appName, brandColor, accentColor, logoUrl } = usePreview();

  return (
    <aside className="hidden xl:flex w-[380px] shrink-0 items-start justify-center sticky top-0 h-screen py-10 pr-6">
      <div className="sticky top-10">
        <AppPreviewPanel
          appName={appName}
          brandColor={brandColor}
          accentColor={accentColor}
          logoUrl={logoUrl ?? undefined}
        />
      </div>
    </aside>
  );
}
