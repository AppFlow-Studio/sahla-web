"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import IPhoneFrame from "./IPhoneFrame";

const prayers = [
  { name: "Fajr", arabic: "الفجر", time: "5:12 AM" },
  { name: "Dhuhr", arabic: "الظهر", time: "12:30 PM" },
  { name: "Asr", arabic: "العصر", time: "3:45 PM" },
  { name: "Maghrib", arabic: "المغرب", time: "6:28 PM" },
  { name: "Isha", arabic: "العشاء", time: "7:55 PM" },
];

const surahs = [
  { num: 1, en: "Al-Fatihah", ar: "الفاتحة", verses: 7, type: "Meccan" },
  { num: 2, en: "Al-Baqarah", ar: "البقرة", verses: 286, type: "Medinan" },
  { num: 3, en: "Ali 'Imran", ar: "آل عمران", verses: 200, type: "Medinan" },
  { num: 4, en: "An-Nisa", ar: "النساء", verses: 176, type: "Medinan" },
  { num: 36, en: "Ya-Sin", ar: "يس", verses: 83, type: "Meccan" },
  { num: 67, en: "Al-Mulk", ar: "الملك", verses: 30, type: "Meccan" },
  { num: 112, en: "Al-Ikhlas", ar: "الإخلاص", verses: 4, type: "Meccan" },
  { num: 114, en: "An-Nas", ar: "الناس", verses: 6, type: "Meccan" },
];

function StatusBar() {
  return (
    <div className="flex shrink-0 items-center justify-between px-8 pt-14 pb-2 text-[10px] font-medium text-[#f0ebe3]/70">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className="h-[10px] w-[10px] rounded-full border border-[#f0ebe3]/40" />
        <div className="h-[10px] w-[10px] rounded-full border border-[#f0ebe3]/40" />
        <div className="h-[6px] w-[20px] rounded-sm border border-[#f0ebe3]/40">
          <div className="h-full w-3/4 rounded-sm bg-[#4a8c65]" />
        </div>
      </div>
    </div>
  );
}

const prayerIcons: Record<string, string> = {
  Fajr: "M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-5.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707",
  Dhuhr: "M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41M12 7a5 5 0 100 10 5 5 0 000-10z",
  Asr: "M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41M12 7a5 5 0 100 10 5 5 0 000-10z",
  Maghrib: "M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41M12 7a5 5 0 100 10 5 5 0 000-10z",
  Isha: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
};

const mockEvents = [
  { time: "5:00 PM", name: "MAS SI Soccer Program", tag: "Sports & Youth" },
  { time: "5:00 PM", name: "MAS SI Soccer Program", tag: "Sports & Youth" },
  { time: "5:00 PM", name: "MAS SI Soccer Program", tag: "Sports & Youth" },
];

const quickActions = [
  { label: "DONATE", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" },
  { label: "VOLUNTEER", icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" },
  { label: "ADVERTISE", icon: "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" },
  { label: "PRAYERS", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
];

function HomeScreen() {
  return (
    <div className="flex flex-col">
      {/* ── Dark hero section ── */}
      <div style={{ background: "linear-gradient(180deg, #0a1a12 0%, #0d1f16 100%)", padding: "0 16px 12px" }}>
        <p style={{ fontSize: 8, fontWeight: 500, letterSpacing: "0.12em", color: "rgba(196,168,122,0.7)", textTransform: "uppercase", margin: 0 }}>
          Assalamu Alaikum Di
        </p>
        <p style={{ fontSize: 28, fontWeight: 700, color: "#f0ebe3", margin: "2px 0 0", fontFamily: "ui-serif, Georgia, serif", lineHeight: 1.1 }}>
          4:01 PM
        </p>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#f0ebe3", margin: "2px 0 0" }}>
          Ramadan 13, 1447
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#4a8c65" }} />
          <p style={{ fontSize: 9, color: "rgba(240,235,227,0.6)", margin: 0 }}>
            <span style={{ color: "#f0ebe3", fontWeight: 600 }}>Maghrib</span> iqamah in 1h 53m
          </p>
        </div>

        {/* Prayer times bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16, gap: 4 }}>
          {prayers.map((p) => {
            const isActive = p.name === "Maghrib";
            return (
              <div key={p.name} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "6px 6px 5px", borderRadius: 10, flex: 1,
                backgroundColor: isActive ? "#0A261E" : "transparent",
              }}>
                <p style={{ fontSize: 7, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: isActive ? "#c4a87a" : "rgba(240,235,227,0.35)", margin: 0 }}>
                  {p.name}
                </p>
                <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke={isActive ? "#c4a87a" : "rgba(240,235,227,0.25)"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d={prayerIcons[p.name]} />
                </svg>
                <p style={{ fontSize: 8, fontWeight: isActive ? 600 : 400, color: isActive ? "#c4a87a" : "rgba(240,235,227,0.35)", margin: 0 }}>
                  5:14 AM
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Light section ── */}
      <div style={{ backgroundColor: "#f0ebe3", borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -10, padding: "16px 14px 10px", flex: 1 }}>

        {/* Donate banner */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "#0A261E", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#4a8c65", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg style={{ width: 16, height: 16, color: "#fff" }} viewBox="0 0 24 24" fill="currentColor"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#f0ebe3", margin: 0 }}>Support Your Masjid</p>
            <p style={{ fontSize: 8, color: "rgba(240,235,227,0.5)", margin: 0 }}>Donate</p>
          </div>
          <div style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(196,168,122,0.5)", backgroundColor: "transparent" }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: "#c4a87a", letterSpacing: "0.04em" }}>DONATE →</span>
          </div>
        </div>

        {/* Today's Events */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#0A261E", margin: 0 }}>TODAY&apos;S EVENTS</p>
          <p style={{ fontSize: 8, fontWeight: 500, color: "#c4a87a", margin: 0 }}>MAR 9, 2026</p>
        </div>

        <div style={{ borderRadius: 12, border: "1px solid rgba(10,38,30,0.08)", overflow: "hidden", backgroundColor: "#fff" }}>
          {mockEvents.map((ev, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 12px", borderBottom: i < mockEvents.length - 1 ? "1px solid rgba(10,38,30,0.06)" : "none" }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: "#0A261E", margin: 0, width: 42, flexShrink: 0 }}>{ev.time}</p>
              <div style={{ width: 1, height: 24, backgroundColor: "rgba(10,38,30,0.10)", margin: "0 10px", flexShrink: 0 }} />
              <p style={{ fontSize: 10, fontWeight: 600, color: "#0A261E", margin: 0, flex: 1, lineHeight: 1.3 }}>{ev.name}</p>
              <span style={{ fontSize: 7, fontWeight: 500, color: "#4a8c65", border: "1px solid rgba(74,140,101,0.35)", borderRadius: 8, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{ev.tag}</span>
            </div>
          ))}
        </div>

        {/* Featured card */}
        <div style={{ marginTop: 14, borderRadius: 14, background: "linear-gradient(135deg, #d9c4a0 0%, #c4a87a 100%)", padding: "12px 14px", position: "relative", overflow: "hidden" }}>
          <span style={{ fontSize: 7, fontWeight: 600, color: "#fff", backgroundColor: "#4a8c65", borderRadius: 6, padding: "2px 6px" }}>Featured</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0A261E", margin: "6px 0 2px" }}>Weekend Islamic School</p>
          <p style={{ fontSize: 8, color: "rgba(10,38,30,0.55)", margin: 0 }}>Saturdays &amp; Sundays · 10:00 AM – 1:00 PM</p>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 6 }}>
          {quickActions.map((a) => (
            <div key={a.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid rgba(10,38,30,0.10)", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="#0A261E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
              </div>
              <span style={{ fontSize: 6, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(10,38,30,0.5)" }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* Programs header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 8, borderTop: "1px solid rgba(10,38,30,0.06)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#0A261E", margin: 0 }}>PROGRAMS</p>
          <p style={{ fontSize: 8, fontWeight: 500, color: "#c4a87a", margin: 0 }}>SEE ALL</p>
        </div>
      </div>
    </div>
  );
}

function PrayerTimesScreen() {
  const [alarms, setAlarms] = useState([true, true, true, true, true]);
  const toggleAlarm = (i: number) =>
    setAlarms((a) => a.map((v, j) => (j === i ? !v : v)));

  return (
    <div className="flex flex-col px-4 pt-3 pb-2">
      <p className="text-[14px] font-semibold text-[#f0ebe3]">Prayer Times</p>
      <p className="text-[9px] text-[#c4a87a]/40">
        Tuesday, March 24, 2026
      </p>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-[#c4a87a]/[0.06] px-3 py-2">
        <span className="text-[9px] text-[#c4a87a]/50">☀ Sunrise</span>
        <span className="text-[10px] text-[#c4a87a]/40">6:38 AM</span>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {prayers.map((p, i) => (
          <div
            key={p.name}
            className="flex items-center justify-between rounded-xl bg-[#f0ebe3]/[0.03] px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a8c65]/15">
                <span className="text-[9px] text-[#4a8c65]">{p.arabic}</span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#f0ebe3]/70">
                  {p.name}
                </p>
                <p className="text-[9px] text-[#f0ebe3]/25">{p.time}</p>
              </div>
            </div>
            <button
              onClick={() => toggleAlarm(i)}
              className="cursor-pointer border-0 bg-transparent p-1"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill={alarms[i] ? "#4a8c65" : "none"}
                stroke={alarms[i] ? "#4a8c65" : "rgba(240,235,227,0.2)"}
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-[#f0ebe3]/[0.02] px-3 py-2">
        <p className="text-[8px] uppercase tracking-wider text-[#f0ebe3]/20">
          Calculation: ISNA · Madhab: Hanafi
        </p>
      </div>
    </div>
  );
}

function QiblaScreen() {
  const qiblaAngle = 58;
  const rad = (qiblaAngle * Math.PI) / 180;
  const needleX = 100 + 55 * Math.sin(rad);
  const needleY = 100 - 55 * Math.cos(rad);
  const kaabaX = 100 + 65 * Math.sin(rad);
  const kaabaY = 100 - 65 * Math.cos(rad);

  return (
    <div className="flex flex-col items-center px-4 pt-3 pb-2">
      <p className="text-[14px] font-semibold text-[#f0ebe3]">
        Qibla Direction
      </p>
      <p className="text-[9px] text-[#c4a87a]/40">Face towards the Ka&apos;bah</p>

      <div className="relative mt-3 h-[150px] w-[150px]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="rgba(74,140,101,0.15)"
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="rgba(74,140,101,0.08)"
            strokeWidth="1"
          />
          {Array.from({ length: 36 }).map((_, i) => {
            const deg = i * 10;
            const a = (deg * Math.PI) / 180;
            const major = deg % 90 === 0;
            const r1 = major ? 74 : 80;
            return (
              <line
                key={i}
                x1={100 + r1 * Math.sin(a)}
                y1={100 - r1 * Math.cos(a)}
                x2={100 + 86 * Math.sin(a)}
                y2={100 - 86 * Math.cos(a)}
                stroke={
                  major
                    ? "rgba(240,235,227,0.35)"
                    : "rgba(240,235,227,0.08)"
                }
                strokeWidth={major ? 2 : 1}
              />
            );
          })}
          <text
            x="100"
            y="22"
            textAnchor="middle"
            fill="#f0ebe3"
            fontSize="9"
            fontWeight="bold"
          >
            N
          </text>
          <text
            x="100"
            y="190"
            textAnchor="middle"
            fill="rgba(240,235,227,0.2)"
            fontSize="9"
          >
            S
          </text>
          <text
            x="186"
            y="104"
            textAnchor="middle"
            fill="rgba(240,235,227,0.2)"
            fontSize="9"
          >
            E
          </text>
          <text
            x="14"
            y="104"
            textAnchor="middle"
            fill="rgba(240,235,227,0.2)"
            fontSize="9"
          >
            W
          </text>
          <line
            x1="100"
            y1="100"
            x2={needleX}
            y2={needleY}
            stroke="#4a8c65"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="100"
            y1="100"
            x2={100 - 20 * Math.sin(rad)}
            y2={100 + 20 * Math.cos(rad)}
            stroke="rgba(240,235,227,0.15)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="4" fill="#4a8c65" />
          <rect
            x={kaabaX - 5}
            y={kaabaY - 5}
            width="10"
            height="10"
            rx="2"
            fill="#c4a87a"
          />
        </svg>
      </div>

      <div className="mt-1 text-center">
        <p className="text-[13px] font-semibold text-[#4a8c65]">{qiblaAngle}° NE</p>
        <p className="text-[9px] text-[#f0ebe3]/25">12,284 km to Makkah</p>
      </div>

      <div className="mt-3 w-full rounded-xl bg-[#f0ebe3]/[0.03] p-3 text-center">
        <p className="text-[9px] text-[#f0ebe3]/30">
          Point your device towards the green indicator to face the Qibla
        </p>
      </div>
    </div>
  );
}

function QuranScreen() {
  const [selected, setSelected] = useState(-1);

  return (
    <div className="flex flex-col px-4 pt-3 pb-2">
      <p className="text-[14px] font-semibold text-[#f0ebe3]">Holy Quran</p>

      <div className="mt-2 flex items-center rounded-lg bg-[#f0ebe3]/[0.05] px-3 py-1.5">
        <svg
          className="mr-2 h-3 w-3 text-[#f0ebe3]/20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="text-[9px] text-[#f0ebe3]/20">Search surahs...</span>
      </div>

      {selected >= 0 && (
        <div className="mt-2 rounded-xl bg-[#4a8c65]/10 p-3">
          <p className="text-center text-[11px] leading-relaxed text-[#f0ebe3]/50">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </p>
          <p className="mt-1 text-center text-[8px] text-[#c4a87a]/40">
            In the name of Allah, the Most Gracious, the Most Merciful
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1">
        {surahs.map((s) => (
          <button
            key={s.num}
            onClick={() => setSelected(selected === s.num ? -1 : s.num)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border-0 px-2 py-2 text-left transition-colors ${
              selected === s.num
                ? "bg-[#4a8c65]/15"
                : "bg-[#f0ebe3]/[0.02]"
            }`}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#1a3a2a] text-[8px] font-bold text-[#4a8c65]">
              {s.num}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#f0ebe3]/60">{s.en}</p>
              <p className="text-[8px] text-[#c4a87a]/25">
                {s.verses} verses · {s.type}
              </p>
            </div>
            <span className="text-[12px] text-[#c4a87a]/35">{s.ar}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsScreen() {
  const [toggles, setToggles] = useState({
    notifications: true,
    adhan: true,
    darkMode: true,
    location: false,
  });

  const items: { key: keyof typeof toggles; label: string; desc: string }[] = [
    {
      key: "notifications",
      label: "Prayer Notifications",
      desc: "Remind before each prayer",
    },
    { key: "adhan", label: "Adhan Sound", desc: "Play call to prayer" },
    { key: "darkMode", label: "Dark Mode", desc: "Reduce eye strain" },
    {
      key: "location",
      label: "Auto Location",
      desc: "GPS for accurate times",
    },
  ];

  return (
    <div className="flex flex-col px-4 pt-3 pb-2">
      <p className="text-[14px] font-semibold text-[#f0ebe3]">Settings</p>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#f0ebe3]/[0.03] px-3 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a8c65]/20">
          <span className="text-[14px] text-[#4a8c65]">A</span>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#f0ebe3]/70">
            Ahmad Hassan
          </p>
          <p className="text-[9px] text-[#c4a87a]/40">Community Member</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => {
          const isOn = toggles[item.key];
          return (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl bg-[#f0ebe3]/[0.03] px-3 py-2.5"
            >
              <div>
                <p className="text-[10px] text-[#f0ebe3]/60">{item.label}</p>
                <p className="text-[8px] text-[#f0ebe3]/20">{item.desc}</p>
              </div>
              <button
                onClick={() =>
                  setToggles((t) => ({ ...t, [item.key]: !t[item.key] }))
                }
                className={`relative h-5 w-9 cursor-pointer rounded-full border-0 transition-colors ${
                  isOn ? "bg-[#4a8c65]" : "bg-[#f0ebe3]/10"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    isOn ? "translate-x-[16px]" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg bg-[#c4a87a]/[0.04] px-3 py-2">
        <p className="text-[8px] uppercase tracking-wider text-[#c4a87a]/30">
          Calculation: ISNA · Madhab: Hanafi
        </p>
      </div>
    </div>
  );
}

function TabBar({
  current,
  onSelect,
}: {
  current: number;
  onSelect?: (i: number) => void;
}) {
  const tabs = [
    { label: "Home", d: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
    { label: "Times", d: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Qibla", d: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" },
    { label: "Quran", d: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
    { label: "Settings", d: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" },
  ];

  return (
    <div className="flex shrink-0 items-center justify-around border-t border-[#f0ebe3]/5 px-1 pt-1.5 pb-5">
      {tabs.map((tab, i) => {
        const active = i === current;
        const color = active ? "#4a8c65" : "rgba(240,235,227,0.2)";
        return (
          <button
            key={tab.label}
            onClick={() => onSelect?.(i)}
            className="flex cursor-pointer flex-col items-center gap-0.5 border-0 bg-transparent px-2 py-0.5"
          >
            <svg
              className="h-[16px] w-[16px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={tab.d} />
            </svg>
            <span className="text-[7px]" style={{ color }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const screenConfigs = [
  { title: "Home", gradient: "from-[#0a1a12] to-[#060d09]", Component: HomeScreen },
  { title: "Prayer Times", gradient: "from-[#0c1c14] to-[#060d09]", Component: PrayerTimesScreen },
  { title: "Qibla", gradient: "from-[#0a1a15] to-[#060d09]", Component: QiblaScreen },
  { title: "Quran", gradient: "from-[#0d1810] to-[#060d09]", Component: QuranScreen },
  { title: "Settings", gradient: "from-[#0a1510] to-[#060d09]", Component: SettingsScreen },
];

interface PhoneCarouselProps {
  demoMode?: boolean;
}

export default function PhoneCarousel({ demoMode = false }: PhoneCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval>>(null);
  const wheelAccum = useRef(0);
  const total = screenConfigs.length;

  const goTo = useCallback(
    (direction: 1 | -1) => {
      if (isSpinning) return;
      setSlideDirection(direction);
      setCurrentIndex((prev) => {
        const next = prev + direction;
        if (next < 0) return total - 1;
        if (next >= total) return 0;
        return next;
      });
    },
    [isSpinning, total]
  );

  const spinTo = useCallback(
    async (direction: 1 | -1) => {
      if (isSpinning) return;
      setIsSpinning(true);

      await controls.start({
        rotateY: direction * 90,
        transition: { duration: 0.3, ease: [0.4, 0, 0.6, 1] },
      });

      setCurrentIndex((prev) => {
        const next = prev + direction;
        if (next < 0) return total - 1;
        if (next >= total) return 0;
        return next;
      });

      controls.set({ rotateY: direction * -90 });

      await controls.start({
        rotateY: 0,
        transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
      });

      wheelAccum.current = 0;
      setIsSpinning(false);
    },
    [isSpinning, controls, total]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (demoMode) return;
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = isHorizontal ? e.deltaX : e.deltaY;
      wheelAccum.current += delta;

      if (wheelAccum.current > 120) {
        wheelAccum.current = 0;
        spinTo(1);
      } else if (wheelAccum.current < -120) {
        wheelAccum.current = 0;
        spinTo(-1);
      }
    },
    [spinTo, demoMode]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (demoMode) {
        if (dx > 60) goTo(-1);
        else if (dx < -60) goTo(1);
      } else {
        if (dx > 50) spinTo(-1);
        else if (dx < -50) spinTo(1);
      }
    },
    [spinTo, goTo, demoMode]
  );

  useEffect(() => {
    if (demoMode) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      return;
    }
    const timeout = setTimeout(() => {
      autoplayRef.current = setInterval(() => {
        if (!isSpinning) spinTo(1);
      }, 5000);
    }, 2000);
    return () => {
      clearTimeout(timeout);
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isSpinning, spinTo, demoMode]);

  const handleTabSelect = useCallback(
    (i: number) => {
      if (i === currentIndex) return;
      setSlideDirection(i > currentIndex ? 1 : -1);
      setCurrentIndex(i);
    },
    [currentIndex]
  );

  const config = screenConfigs[currentIndex];
  const ScreenComponent = config.Component;

  const phoneInternals = (
    <div className={`flex h-full flex-col bg-gradient-to-b ${config.gradient}`}>
      <StatusBar />
      <div className="relative flex-1 overflow-hidden">
        {demoMode ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentIndex}
              className="absolute inset-0 overflow-y-auto"
              initial={{ x: slideDirection * 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDirection * -280, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <ScreenComponent />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="h-full overflow-y-auto">
            <ScreenComponent />
          </div>
        )}
      </div>
      <TabBar
        current={currentIndex}
        onSelect={handleTabSelect}
      />
    </div>
  );

  if (demoMode) {
    return (
      <div className="flex flex-col items-center">
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <IPhoneFrame>{phoneInternals}</IPhoneFrame>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="cursor-grab active:cursor-grabbing"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          animate={controls}
          style={{ transformStyle: "preserve-3d" }}
        >
          <IPhoneFrame>{phoneInternals}</IPhoneFrame>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={config.title}
          className="text-center text-sm tracking-[0.15em] uppercase text-[#c4a87a]/60"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {config.title}
        </motion.p>
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {screenConfigs.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === currentIndex ? 20 : 6,
              backgroundColor:
                i === currentIndex ? "#4a8c65" : "rgba(196,168,122,0.25)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
