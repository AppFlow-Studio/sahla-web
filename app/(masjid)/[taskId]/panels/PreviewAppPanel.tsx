"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ToastProvider";

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

const SAMPLE_PRAYERS = [
  { name: "Fajr", adhan: "5:12 AM", iqamah: "5:45 AM" },
  { name: "Dhuhr", adhan: "1:02 PM", iqamah: "1:30 PM" },
  { name: "Asr", adhan: "5:18 PM", iqamah: "5:45 PM" },
  { name: "Maghrib", adhan: "8:14 PM", iqamah: "8:19 PM" },
  { name: "Isha", adhan: "9:44 PM", iqamah: "10:00 PM" },
];

export default function PreviewAppPanel({ data }: { data: PreviewData }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "programs" | "donate">("home");

  const brandColor = data.mosque.brand_color || "#0D7C5F";
  const appName = data.mosque.app_name || data.mosque.name || "Mosque App";
  const displayLetter = (data.mosque.name || "M").charAt(0).toUpperCase();
  const location = [data.mosque.city, data.mosque.state].filter(Boolean).join(", ");

  async function handleMarkComplete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${data.mosque.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markComplete: "preview_app" }),
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
    <div className="space-y-6">
      {/* Launch Summary */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <p className="mb-4 text-[13px] font-semibold text-stone-800">Launch Summary</p>
        <div className="space-y-2">
          {[
            { label: "Mosque Name", value: data.mosque.name || "Not set", done: !!data.mosque.name },
            { label: "App Name", value: appName, done: !!data.mosque.app_name },
            { label: "Brand Color", value: brandColor, done: !!data.mosque.brand_color, color: true },
            { label: "Logo", value: data.mosque.logo_url ? "Uploaded" : "Not uploaded", done: !!data.mosque.logo_url },
            { label: "Prayer Times", value: data.hasPrayerTimes ? "Configured" : "Not configured", done: data.hasPrayerTimes },
            { label: "Speakers", value: `${data.counts.speakers} added`, done: data.counts.speakers > 0 },
            { label: "Programs", value: `${data.counts.programs} added`, done: data.counts.programs > 0 },
            { label: "Events", value: `${data.counts.events} added`, done: data.counts.events > 0 },
            { label: "Stripe", value: data.hasStripe ? "Connected" : "Not connected", done: data.hasStripe },
            { label: "Donations", value: data.hasDonations ? "Configured" : "Not configured", done: data.hasDonations },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5">
              <span className="text-[12px] text-stone-500">{row.label}</span>
              <div className="flex items-center gap-2">
                {row.color ? (
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full border border-stone-200" style={{ backgroundColor: row.value }} />
                    <span className="text-[12px] font-mono text-stone-700">{row.value}</span>
                  </div>
                ) : (
                  <span className={`text-[12px] ${row.done ? "text-stone-700" : "text-stone-400"}`}>
                    {row.value}
                  </span>
                )}
                {row.done ? (
                  <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-stone-200" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phone Mockup */}
      <div className="flex justify-center">
        <div className="relative w-[280px]">
          {/* Phone frame */}
          <div className="rounded-[36px] border-[6px] border-stone-800 bg-stone-800 p-1 shadow-xl">
            {/* Notch */}
            <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-stone-800" />
            {/* Screen */}
            <div className="overflow-hidden rounded-[28px] bg-white">
              {/* Status Bar */}
              <div className="flex items-center justify-between px-5 pb-1 pt-7 text-[9px] font-medium text-stone-800">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c5.523-5.523 14.477-5.523 20 0l2-2C17.523 1.523 8.477 1.523 1 9z"/></svg>
                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><rect x="17" y="4" width="4" height="16" rx="1"/><rect x="11" y="8" width="4" height="12" rx="1"/><rect x="5" y="12" width="4" height="8" rx="1"/></svg>
                </div>
              </div>

              {/* App Header */}
              <div className="px-4 pb-3 pt-1" style={{ backgroundColor: brandColor }}>
                <div className="flex items-center gap-2.5">
                  {data.mosque.logo_url ? (
                    <div
                      className="h-8 w-8 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${data.mosque.logo_url})` }}
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-[11px] font-bold text-white">
                      {displayLetter}
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-semibold text-white">{data.mosque.name || "Your Mosque"}</p>
                    {location && <p className="text-[8px] text-white/70">{location}</p>}
                  </div>
                </div>
              </div>

              {/* Tab Bar */}
              <div className="flex border-b border-stone-100">
                {(["home", "programs", "donate"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 py-2 text-center text-[9px] font-medium capitalize transition-colors"
                    style={{
                      color: activeTab === tab ? brandColor : "#a8a29e",
                      borderBottom: activeTab === tab ? `2px solid ${brandColor}` : "2px solid transparent",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Screen Content */}
              <div className="h-[340px] overflow-hidden px-3 py-3">
                {activeTab === "home" && (
                  <div className="space-y-2.5">
                    {/* Prayer Times Card */}
                    <div className="rounded-xl p-3" style={{ backgroundColor: `${brandColor}08` }}>
                      <p className="mb-2 text-[9px] font-semibold text-stone-700">Today&apos;s Prayers</p>
                      {SAMPLE_PRAYERS.map((prayer) => (
                        <div key={prayer.name} className="flex items-center justify-between py-1">
                          <span className="text-[8px] font-medium text-stone-600 w-12">{prayer.name}</span>
                          <span className="text-[8px] tabular-nums text-stone-400">{prayer.adhan}</span>
                          <span className="text-[8px] font-medium tabular-nums" style={{ color: brandColor }}>{prayer.iqamah}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { icon: "M12 6v12m6-6H6", label: "Donate" },
                        { icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5", label: "Events" },
                        { icon: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25", label: "Programs" },
                      ].map((action) => (
                        <div key={action.label} className="flex flex-col items-center gap-1 rounded-lg border border-stone-100 py-2">
                          <svg className="h-3.5 w-3.5" style={{ color: brandColor }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                          </svg>
                          <span className="text-[7px] text-stone-500">{action.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Upcoming */}
                    <div>
                      <p className="mb-1.5 text-[9px] font-semibold text-stone-700">Upcoming</p>
                      {data.counts.events > 0 || data.counts.programs > 0 ? (
                        <div className="space-y-1.5">
                          {data.counts.programs > 0 && (
                            <div className="rounded-lg border border-stone-100 px-2.5 py-2">
                              <p className="text-[8px] font-medium text-stone-700">Weekly Halaqa</p>
                              <p className="text-[7px] text-stone-400">Every Wednesday</p>
                            </div>
                          )}
                          {data.counts.events > 0 && (
                            <div className="rounded-lg border border-stone-100 px-2.5 py-2">
                              <p className="text-[8px] font-medium text-stone-700">Community Dinner</p>
                              <p className="text-[7px] text-stone-400">This Saturday</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-stone-200 py-3 text-center">
                          <p className="text-[7px] text-stone-300">Add programs or events to preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "programs" && (
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-semibold text-stone-700">Programs & Classes</p>
                    {data.counts.programs > 0 ? (
                      <div className="space-y-1.5">
                        {Array.from({ length: Math.min(data.counts.programs, 4) }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2.5 rounded-lg border border-stone-100 px-2.5 py-2">
                            <div className="h-6 w-6 rounded-md" style={{ backgroundColor: `${brandColor}15` }} />
                            <div className="flex-1">
                              <div className="h-2 w-20 rounded bg-stone-200" />
                              <div className="mt-1 h-1.5 w-14 rounded bg-stone-100" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8">
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100">
                          <svg className="h-4 w-4 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                        <p className="text-[8px] text-stone-300">No programs yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "donate" && (
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-semibold text-stone-700">Donate</p>
                    {data.hasDonations ? (
                      <>
                        <div className="rounded-xl p-3" style={{ backgroundColor: `${brandColor}08` }}>
                          <p className="text-[9px] font-medium text-stone-700">General Fund</p>
                          <div className="mt-2 h-1 rounded-full bg-stone-200">
                            <div className="h-1 w-1/3 rounded-full" style={{ backgroundColor: brandColor }} />
                          </div>
                          <p className="mt-1 text-[7px] text-stone-400">$12,450 of $50,000</p>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[25, 50, 100, 250].map((amt) => (
                            <button
                              key={amt}
                              className="rounded-lg border border-stone-200 py-1.5 text-center text-[8px] font-medium text-stone-600"
                            >
                              ${amt}
                            </button>
                          ))}
                        </div>
                        <button
                          className="w-full rounded-lg py-2 text-[9px] font-semibold text-white"
                          style={{ backgroundColor: brandColor }}
                        >
                          Donate Now
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center py-8">
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100">
                          <svg className="h-4 w-4 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                          </svg>
                        </div>
                        <p className="text-[8px] text-stone-300">Configure donations to preview</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center justify-around border-t border-stone-100 px-2 pb-4 pt-1.5">
                {[
                  { icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25", label: "Home" },
                  { icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z", label: "Donate" },
                  { icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z", label: "Settings" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-0.5">
                    <svg className="h-3.5 w-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="text-[6px] text-stone-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-3 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-stone-600" />
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
