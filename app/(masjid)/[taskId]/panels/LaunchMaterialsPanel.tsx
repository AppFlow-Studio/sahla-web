"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ToastProvider";

type MosqueInfo = {
  id: string;
  name: string | null;
  app_name: string | null;
  city: string | null;
  state: string | null;
};

function getMosqueName(mosque: MosqueInfo) {
  return mosque.name || "Your Mosque";
}

function getAppName(mosque: MosqueInfo) {
  return mosque.app_name || mosque.name || "the app";
}

function getLocation(mosque: MosqueInfo) {
  return [mosque.city, mosque.state].filter(Boolean).join(", ");
}

function getEmailTemplate(mosque: MosqueInfo) {
  const name = getMosqueName(mosque);
  const app = getAppName(mosque);
  return `Assalamu Alaikum,

We are excited to announce the launch of ${name}'s official mobile app — ${app}!

With ${app}, you can:
- View daily prayer times and iqamah schedules
- Stay updated on programs, events, and announcements
- Donate directly to ${name}
- And much more!

Download the app today from the App Store or Google Play. Search for "${app}" or scan the QR code on our poster.

JazakAllah Khair,
${name}`;
}

function getWhatsAppTemplate(mosque: MosqueInfo) {
  const name = getMosqueName(mosque);
  const app = getAppName(mosque);
  return `Assalamu Alaikum! ${name} now has its own app — *${app}*! Get prayer times, event updates, and donate directly from your phone. Download it from the App Store or Google Play today. Search "${app}".`;
}

function getSocialTemplate(mosque: MosqueInfo) {
  const name = getMosqueName(mosque);
  const app = getAppName(mosque);
  const location = getLocation(mosque);
  return `${name}${location ? ` in ${location}` : ""} just launched its official mobile app — ${app}!

Prayer times, events, programs, and donations — all in one place.

Available now on the App Store and Google Play. Download today and stay connected with your community.

#MosqueApp #${name.replace(/\s+/g, "")} #Muslim #Community`;
}

function getAnnouncementTemplate(mosque: MosqueInfo) {
  const name = getMosqueName(mosque);
  const app = getAppName(mosque);
  return `Dear brothers and sisters,

I am pleased to announce that ${name} has launched its official mobile application, ${app}.

This app will allow you to view daily prayer and iqamah times, stay informed about our programs and events, and support our masjid through convenient online donations.

I encourage everyone to download the app today. You can find it by searching "${app}" in the App Store or Google Play Store. There are QR code posters at the entrance for your convenience.

May Allah bless our community and make this a means of bringing us closer together.

Barakallahu feekum.`;
}

export default function LaunchMaterialsPanel({ mosque }: { mosque: MosqueInfo }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast("Copied to clipboard", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy", "error");
    }
  }

  async function handleMarkComplete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosque.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markComplete: "launch_materials" }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Launch materials reviewed", "success");
      router.refresh();
    } catch {
      showToast("Failed to mark complete", "error");
    } finally {
      setSaving(false);
    }
  }

  const materials = [
    {
      id: "qr",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
        </svg>
      ),
      title: "QR Code Poster",
      description: "Print and display at your masjid entrance",
      type: "download" as const,
    },
    {
      id: "email",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      ),
      title: "Email Announcement",
      description: "Send to your mailing list",
      type: "copy" as const,
      content: getEmailTemplate(mosque),
    },
    {
      id: "whatsapp",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      ),
      title: "WhatsApp Message",
      description: "Share in your community group",
      type: "copy" as const,
      content: getWhatsAppTemplate(mosque),
    },
    {
      id: "social",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
        </svg>
      ),
      title: "Social Media Post",
      description: "Post on Instagram, Facebook, or X",
      type: "copy" as const,
      content: getSocialTemplate(mosque),
    },
    {
      id: "announcement",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
        </svg>
      ),
      title: "Jummah Announcement Script",
      description: "Read during Friday khutbah announcements",
      type: "copy" as const,
      content: getAnnouncementTemplate(mosque),
      serif: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-5 py-4">
        <p className="text-[13px] text-blue-800">
          All materials below are pre-filled with your mosque&apos;s name. Copy and customize as needed.
        </p>
      </div>

      <div className="space-y-3">
        {materials.map((material) => (
          <div
            key={material.id}
            className="rounded-xl border border-stone-200 bg-white p-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                {material.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-stone-900">{material.title}</p>
                <p className="text-[11px] text-stone-400">{material.description}</p>

                {material.type === "copy" && material.content && (
                  <>
                    <div className={`mt-3 max-h-32 overflow-y-auto rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5 text-[11px] leading-relaxed text-stone-600 whitespace-pre-wrap ${material.serif ? "font-serif italic" : ""}`}>
                      {material.content}
                    </div>
                    <button
                      onClick={() => copyToClipboard(material.content!, material.id)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-[11px] font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                      {copiedId === material.id ? (
                        <>
                          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </>
                )}

                {material.type === "download" && (
                  <div className="mt-3 rounded-lg border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-center">
                    <p className="text-[11px] text-stone-400">
                      QR code poster will be generated when your app is live
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mark Complete */}
      <div className="flex justify-end">
        <button
          onClick={handleMarkComplete}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Mark Complete"}
        </button>
      </div>
    </div>
  );
}
