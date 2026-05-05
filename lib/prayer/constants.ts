import type { PrayerName } from "./types";

export const PRAYER_NAMES: PrayerName[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export const PRAYER_DISPLAY_NAMES: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const CALCULATION_METHODS = [
  { value: 0, label: "Shia Ithna-Ansari" },
  { value: 1, label: "University of Islamic Sciences, Karachi" },
  { value: 2, label: "Islamic Society of North America (ISNA)" },
  { value: 3, label: "Muslim World League" },
  { value: 4, label: "Umm Al-Qura University, Makkah" },
  { value: 5, label: "Egyptian General Authority of Survey" },
  { value: 7, label: "Institute of Geophysics, University of Tehran" },
  { value: 8, label: "Gulf Region" },
  { value: 9, label: "Kuwait" },
  { value: 10, label: "Qatar" },
  { value: 11, label: "Majlis Ugama Islam Singapura, Singapore" },
  { value: 12, label: "Union Organization Islamic de France" },
  { value: 13, label: "Diyanet İşleri Başkanlığı, Turkey" },
  { value: 14, label: "Spiritual Administration of Muslims of Russia" },
] as const;

export const SCHOOLS = [
  { value: 0, label: "Shafi (Standard)" },
  { value: 1, label: "Hanafi" },
] as const;

export const MIDNIGHT_MODES = [
  { value: 0, label: "Standard (Mid Sunset to Sunrise)" },
  { value: 1, label: "Jafari (Mid Sunset to Fajr)" },
] as const;

export const LATITUDE_ADJUSTMENT_METHODS = [
  { value: 1, label: "Middle of the Night" },
  { value: 2, label: "One Seventh" },
  { value: 3, label: "Angle Based" },
] as const;

export const SHAFAQ_OPTIONS = [
  { value: "general", label: "General (default)" },
  { value: "ahmer", label: "Ahmer (red twilight)" },
  { value: "abyad", label: "Abyad (white twilight)" },
] as const;
