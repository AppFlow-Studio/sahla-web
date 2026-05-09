export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type IqamahMode = "fixed" | "offset" | "seasonal";

export type SeasonalRule = {
  start_date: string; // MM-DD
  end_date: string; // MM-DD
  mode: "fixed" | "offset";
  value: string | number; // HH:MM for fixed, minutes for offset
};

export type IqamahConfig = {
  id?: string;
  mosque_id: string;
  prayer_name: PrayerName;
  mode: IqamahMode;
  fixed_time: string | null;
  offset_minutes: number | null;
  seasonal_rules: SeasonalRule[] | null;
};

export type TodaysPrayer = {
  mosque_id: string;
  prayer_name: PrayerName;
  athan_time: string;
  iqamah_time: string;
};

export type AlAdhanParams = {
  method: number;
  school: number;
  midnightMode?: number;
  latitudeAdjustmentMethod?: number | null;
  tune?: string | null;
  shafaq?: string;
};

export type AlAdhanTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
};

export type AlAdhanDayData = {
  timings: AlAdhanTimings;
  date: {
    readable: string;
    hijri: {
      date: string;
      month: { en: string; ar: string };
    };
    gregorian: {
      date: string; // DD-MM-YYYY
    };
  };
  meta: {
    method: { id: number; name: string };
    school: string;
  };
};
