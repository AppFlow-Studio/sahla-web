export type Speaker = {
  id: string;
  name: string;
  credentials: string;
  bio: string;
  photoUrl: string;
  programsCount: number;
  /** ISO 8601 */
  lastSpokeAt: string | null;
  email?: string;
};

/** Stable Unsplash portraits (free-to-use) used as placeholder headshots. */
const photo = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=facearea&facepad=2.5&w=160&h=160&q=80`;

export const seedSpeakers: Speaker[] = [
  {
    id: "spk_01",
    name: "Sheikh Omar Suleiman",
    credentials: "President, Yaqeen Institute · PhD Islamic Studies",
    bio: "Leads our flagship Friday halaqa series. Specializes in tazkiyah and contemporary fiqh.",
    photoUrl: photo("photo-1507003211169-0a1dd7228f2d"),
    programsCount: 32,
    lastSpokeAt: "2026-05-02T19:30:00Z",
    email: "omar@example.org",
  },
  {
    id: "spk_02",
    name: "Imam Yasir Qadhi",
    credentials: "Resident Scholar · MA Islamic Studies, Yale",
    bio: "Quranic studies, Islamic theology. Joined for our Sirah series.",
    photoUrl: photo("photo-1500648767791-00dcc994a43e"),
    programsCount: 18,
    lastSpokeAt: "2026-04-19T20:00:00Z",
  },
  {
    id: "spk_03",
    name: "Dr. Ingrid Mattson",
    credentials: "Chair, Islamic Studies · University of Western Ontario",
    bio: "Historical scholarship of Islamic law. Sisters' weekly seminar.",
    photoUrl: photo("photo-1573497019940-1c28c88b4f3e"),
    programsCount: 9,
    lastSpokeAt: "2026-03-28T17:00:00Z",
  },
  {
    id: "spk_04",
    name: "Sheikh Hamza Yusuf",
    credentials: "Co-founder, Zaytuna College",
    bio: "Classical Islamic scholarship. Spoke at our annual fundraiser.",
    photoUrl: photo("photo-1599566150163-29194dcaad36"),
    programsCount: 4,
    lastSpokeAt: "2026-01-10T19:00:00Z",
  },
  {
    id: "spk_05",
    name: "Ustadha Aisha Rahman",
    credentials: "Sisters' programs lead · MA Quranic Sciences",
    bio: "Weekly tafsir circle for sisters. Tajweed instruction.",
    photoUrl: photo("photo-1580489944761-15a19d654956"),
    programsCount: 47,
    lastSpokeAt: "2026-05-05T18:00:00Z",
  },
  {
    id: "spk_06",
    name: "Imam Khalid Latif",
    credentials: "NYU Islamic Center · MDiv Hartford Seminary",
    bio: "Youth and student ministry. College outreach.",
    photoUrl: photo("photo-1568602471122-7832951cc4c5"),
    programsCount: 12,
    lastSpokeAt: "2026-04-12T19:30:00Z",
  },
  {
    id: "spk_07",
    name: "Dr. Tariq Ramadan",
    credentials: "PhD Arabic & Islamic Studies, Geneva",
    bio: "Contemporary Muslim ethics. Annual lecture series.",
    photoUrl: photo("photo-1492562080023-ab3db95bfbce"),
    programsCount: 3,
    lastSpokeAt: "2025-11-22T19:00:00Z",
  },
  {
    id: "spk_08",
    name: "Mufti Abdul-Rahman Mangera",
    credentials: "Director, Whitethread Institute",
    bio: "Hadith and Hanafi fiqh. Monthly Q&A sessions.",
    photoUrl: photo("photo-1564564321837-a57b7070ac4f"),
    programsCount: 7,
    lastSpokeAt: "2026-04-26T20:00:00Z",
  },
  {
    id: "spk_09",
    name: "Sheikh Mokhtar Maghraoui",
    credentials: "PhD Engineering, MIT · Islamic teacher",
    bio: "Spirituality and self-purification. Ramadan night classes.",
    photoUrl: photo("photo-1463453091185-61582044d556"),
    programsCount: 15,
    lastSpokeAt: "2026-03-18T21:00:00Z",
  },
  {
    id: "spk_10",
    name: "Dr. Suzy Ismail",
    credentials: "Cornerstone, marriage and family",
    bio: "Pre-marital counseling and family workshops.",
    photoUrl: photo("photo-1592621385612-4d7129426394"),
    programsCount: 5,
    lastSpokeAt: "2026-02-14T15:00:00Z",
  },
  {
    id: "spk_11",
    name: "Imam Suhaib Webb",
    credentials: "Boston Islamic Seminary · Al-Azhar trained",
    bio: "Maliki fiqh and pastoral counseling.",
    photoUrl: photo("photo-1531427186611-ecfd6d936c79"),
    programsCount: 21,
    lastSpokeAt: "2026-04-30T19:30:00Z",
  },
  {
    id: "spk_12",
    name: "Dr. Jonathan Brown",
    credentials: "Georgetown · Hadith scholar",
    bio: "Hadith methodology. Annual hadith intensive.",
    photoUrl: photo("photo-1535713875002-d1d0cf377fde"),
    programsCount: 6,
    lastSpokeAt: "2026-01-29T19:00:00Z",
  },
  {
    id: "spk_13",
    name: "Ustadh Nouman Ali Khan",
    credentials: "Bayyinah Institute · Quranic linguistics",
    bio: "Quranic Arabic intensive — annual two-week seminar.",
    photoUrl: photo("photo-1507591064344-4c6ce005b128"),
    programsCount: 8,
    lastSpokeAt: "2026-05-01T18:30:00Z",
  },
  {
    id: "spk_14",
    name: "Dr. Yasmin Mogahed",
    credentials: "Author, Reclaim Your Heart · MA Journalism",
    bio: "Spiritual development workshops for sisters.",
    photoUrl: photo("photo-1438761681033-6461ffad8d80"),
    programsCount: 11,
    lastSpokeAt: "2026-04-22T19:00:00Z",
  },
  {
    id: "spk_15",
    name: "Dr. Altaf Husain",
    credentials: "Howard University · Social work",
    bio: "Mental health and community wellbeing.",
    photoUrl: photo("photo-1519085360753-af0119f7cbe7"),
    programsCount: 2,
    lastSpokeAt: "2025-12-10T18:00:00Z",
  },
];
