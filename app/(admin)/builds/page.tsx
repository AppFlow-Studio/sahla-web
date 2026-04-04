import BuildsClient from "./BuildsClient";

const MOCK_APPS = [
  {
    id: "1",
    name: "MAS SI",
    mosqueName: "Islamic Center of NJ",
    icon: null,
    platform: "ios" as const,
    currentVersion: "2.4.1",
    status: "live" as const,
    bundleId: "com.sahla.massi",
    versions: [
      { version: "2.4.1", buildNumber: "87", date: "2026-03-28", notes: "Ramadan prayer time calculation fixes. Improved push notification delivery reliability. Fixed edge case where Taraweeh lineup showed wrong date." },
      { version: "2.4.0", buildNumber: "84", date: "2026-03-15", notes: "Added Taraweeh nightly lineup with imam rotation. New Ramadan Quran tracker with juz progress. Daily Ramadan schedule view." },
      { version: "2.3.2", buildNumber: "79", date: "2026-02-20", notes: "Bug fix: donation receipt emails not sending for recurring donors. Fixed Stripe webhook timeout on large batch processing." },
      { version: "2.3.0", buildNumber: "75", date: "2026-01-10", notes: "Business ads module launch — local businesses can now advertise in-app. Redesigned onboarding flow with 40% faster completion rate." },
      { version: "2.2.0", buildNumber: "68", date: "2025-11-18", notes: "Quran reader with surah bookmarks, ayah highlighting, and continue reading. Multiple reciter audio support." },
    ],
  },
  {
    id: "2",
    name: "Masjid Al-Noor",
    mosqueName: "Masjid Al-Noor",
    icon: null,
    platform: "ios" as const,
    currentVersion: "1.2.0",
    status: "live" as const,
    bundleId: "com.sahla.alnoor",
    versions: [
      { version: "1.2.0", buildNumber: "23", date: "2026-03-01", notes: "Events calendar with RSVP and capacity tracking. Lecture series with AI-generated summaries and key notes." },
      { version: "1.1.0", buildNumber: "15", date: "2026-01-20", notes: "Prayer time notifications with customizable alerts. Jummah reminders with topic preview and speaker info." },
      { version: "1.0.0", buildNumber: "8", date: "2025-12-05", notes: "Initial release — daily prayer times with iqamah, donation portal with Stripe integration, programs and events listing." },
    ],
  },
  {
    id: "3",
    name: "Daar ul-Islam",
    mosqueName: "Daar ul-Islam",
    icon: null,
    platform: "ios" as const,
    currentVersion: "1.0.1",
    status: "review" as const,
    bundleId: "com.sahla.daarulislam",
    versions: [
      { version: "1.0.1", buildNumber: "4", date: "2026-04-02", notes: "Fix: crash on iPad when rotating to landscape. Prayer calculation edge case for high-latitude locations resolved." },
      { version: "1.0.0", buildNumber: "2", date: "2026-03-25", notes: "Initial App Store submission — prayer times with multiple calculation methods, community programs, Stripe donation integration." },
    ],
  },
  {
    id: "4",
    name: "ISB App",
    mosqueName: "Islamic Society of Boston",
    icon: null,
    platform: "ios" as const,
    currentVersion: "1.0.0",
    status: "building" as const,
    bundleId: "com.sahla.isb",
    versions: [
      { version: "1.0.0", buildNumber: "1", date: "2026-04-04", notes: "First build in progress — prayer times, weekly events, Quran reader, and donation portal. EAS build queued." },
    ],
  },
];

export default function BuildsPage() {
  return (
    <div>
      <BuildsClient apps={MOCK_APPS} />
    </div>
  );
}
