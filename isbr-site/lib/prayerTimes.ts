import { site } from "@/config/site";

export type PrayerRow = {
  name: string;
  athan: string;
  iqamah: string;
};

export type PrayerData = {
  rows: PrayerRow[];
  jummah: { athan: string; iqamah: string };
  hijriDate: string | null;
  gregorianReadable: string | null;
};

const FALLBACK: PrayerData = {
  rows: [
    { name: "Fajr", athan: "—", iqamah: "—" },
    { name: "Dhuhr", athan: "—", iqamah: "—" },
    { name: "Asr", athan: "—", iqamah: "—" },
    { name: "Maghrib", athan: "—", iqamah: "—" },
    { name: "Isha", athan: "—", iqamah: "—" },
  ],
  jummah: { athan: "—", iqamah: "—" },
  hijriDate: null,
  gregorianReadable: null,
};

function to12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${period}`;
}

export async function getPrayerTimes(): Promise<PrayerData> {
  const address = `${site.streetAddress}, ${site.city}, ${site.state} ${site.postalCode}`;
  const url = `https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(
    address
  )}&method=2&school=0`;

  try {
    const res = await fetch(url);
    if (!res.ok) return FALLBACK;
    const json = await res.json();
    const timings = json?.data?.timings;
    const hijri = json?.data?.date?.hijri;
    const gregorian = json?.data?.date?.gregorian;
    if (!timings) return FALLBACK;

    const rows: PrayerRow[] = [
      { name: "Fajr", athan: to12Hour(timings.Fajr), iqamah: "—" },
      { name: "Dhuhr", athan: to12Hour(timings.Dhuhr), iqamah: "—" },
      { name: "Asr", athan: to12Hour(timings.Asr), iqamah: "—" },
      { name: "Maghrib", athan: to12Hour(timings.Maghrib), iqamah: "—" },
      { name: "Isha", athan: to12Hour(timings.Isha), iqamah: "—" },
    ];

    const hijriDate = hijri
      ? `${hijri.day} ${hijri.month?.en} ${hijri.year}`
      : null;
    const gregorianReadable = gregorian
      ? `${gregorian.weekday?.en}, ${gregorian.month?.en} ${gregorian.day}, ${gregorian.year}`
      : null;

    return {
      rows,
      jummah: { athan: "—", iqamah: "—" },
      hijriDate,
      gregorianReadable,
    };
  } catch {
    return FALLBACK;
  }
}
