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

function HomeScreen() {
  const [done, setDone] = useState([true, true, false, false, false]);
  const toggle = (i: number) =>
    setDone((d) => d.map((v, j) => (j === i ? !v : v)));
  const nextIdx = done.findIndex((d) => !d);

  return (
    <div className="flex flex-col px-4 pt-3 pb-2">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[10px] text-[#c4a87a]/60">☪</span>
        <span className="text-[9px] text-[#c4a87a]/40">15 Sha&apos;ban 1447 AH</span>
      </div>
      <p className="text-[14px] font-semibold text-[#f0ebe3]">
        Assalamu Alaikum
      </p>
      <p className="text-[9px] text-[#f0ebe3]/30">Welcome back, Ahmad</p>

      {nextIdx >= 0 ? (
        <div className="mt-3 rounded-xl bg-[#4a8c65]/15 p-3">
          <p className="text-[8px] font-semibold tracking-widest uppercase text-[#4a8c65]/70">
            Next Prayer
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-[15px] font-semibold text-[#f0ebe3]">
              {prayers[nextIdx].name}
            </p>
            <p className="text-[13px] font-medium text-[#c4a87a]">
              {prayers[nextIdx].time}
            </p>
          </div>
          <p className="mt-0.5 text-[9px] text-[#f0ebe3]/25">in 2h 15m</p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-[#4a8c65]/20 p-3 text-center">
          <p className="text-[11px] font-medium text-[#4a8c65]">
            ✓ All prayers completed
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1">
        {prayers.map((p, i) => (
          <button
            key={p.name}
            onClick={() => toggle(i)}
            className="flex cursor-pointer items-center gap-2 rounded-lg border-0 bg-[#f0ebe3]/[0.03] px-3 py-2 text-left"
          >
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                done[i]
                  ? "border-[#4a8c65] bg-[#4a8c65]"
                  : "border-[#f0ebe3]/20"
              }`}
            >
              {done[i] && (
                <svg
                  className="h-2.5 w-2.5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              )}
            </div>
            <span
              className={`flex-1 text-[11px] ${
                done[i]
                  ? "text-[#f0ebe3]/25 line-through"
                  : "text-[#f0ebe3]/70"
              }`}
            >
              {p.name}
            </span>
            <span className="text-[10px] text-[#c4a87a]/30">{p.arabic}</span>
            <span className="text-[10px] text-[#f0ebe3]/25">{p.time}</span>
          </button>
        ))}
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
        onSelect={demoMode ? handleTabSelect : undefined}
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
