"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ToastProvider";
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
  const { showToast } = useToast();
  const { brandColor, accentColor, appName } = usePreview();
  const [saving, setSaving] = useState(false);

  async function handleMarkComplete() {
    setSaving(true);
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
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Preview reviewed", "success");
      router.refresh();
    } catch {
      showToast("Failed to mark complete", "error");
    } finally {
      setSaving(false);
    }
  }

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

      {/* Mark Complete */}
      <div className="flex justify-end">
        <button
          onClick={handleMarkComplete}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Looks Good — Mark Complete"}
        </button>
      </div>
    </div>
  );
}
