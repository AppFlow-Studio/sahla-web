"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { usePreview } from "../../components/OnboardingPreviewContext";

type PreviewData = {
  mosque: {
    id: string;
    name: string | null;
    app_name: string | null;
    brand_color: string | null;
    logo_url: string | null;
    city: string | null;
    state: string | null;
  };
  counts: {
    speakers: number;
    programs: number;
    events: number;
  };
  hasPrayerTimes: boolean;
  hasStripe: boolean;
  hasDonations: boolean;
};

export default function PreviewAppPanelOnboarding({ data }: { data: PreviewData }) {
  const router = useRouter();
  const { brandColor, accentColor, appName } = usePreview();
  const markedRef = useRef(false);

  // Review-only screen — visiting = reviewing, so silently mark complete on
  // mount. Also flushes the live-preview brand/accent/app-name back to the
  // DB in case the admin edited them in App Branding without saving there.
  // Idempotent on the backend; guarded by ref so we only fire once.
  useEffect(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    void (async () => {
      try {
        const res = await fetch(`/api/mosques/${data.mosque.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand_color: brandColor,
            accent_color: accentColor,
            app_name: appName,
            markComplete: "preview_app",
          }),
          keepalive: true,
        });
        if (res.ok) router.refresh();
      } catch {
        // Silent — the Next button still works either way.
      }
    })();
  }, [data.mosque.id, brandColor, accentColor, appName, router]);

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-stone-500">
        Review your app in the phone preview on the right. You can go back to App Branding to change colors.
      </p>

      {/* Launch Summary */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="mb-3 text-[12px] font-semibold text-stone-700">Launch Checklist</p>
        <div className="space-y-1.5">
          {[
            { label: "Mosque Name", done: !!data.mosque.name },
            { label: "Logo", done: !!data.mosque.logo_url },
            { label: "Prayer Times", done: data.hasPrayerTimes },
            { label: "Programs", done: data.counts.programs > 0 },
            { label: "Events", done: data.counts.events > 0 },
            { label: "Stripe", done: data.hasStripe },
            { label: "Donations", done: data.hasDonations },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              {row.done ? (
                <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-stone-200 shrink-0" />
              )}
              <span className={`text-[11px] ${row.done ? "text-stone-600" : "text-stone-400"}`}>
                {row.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end text-[11.5px] text-emerald-700">
        <span className="inline-flex items-center gap-1.5">
          <Check size={12} strokeWidth={2.5} />
          Marked as reviewed
        </span>
      </div>
    </div>
  );
}
