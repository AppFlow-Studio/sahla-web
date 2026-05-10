"use client";

import { useState } from "react";

/* ── Helpers ── */
function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function darkenHex(hex: string, amount = 0.3) {
  const h = hex.replace("#", "");
  const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r},${g},${b})`;
}

type AppPreviewPanelProps = {
  appName?: string;
  brandColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  memberCount?: number;
  programCount?: number;
};

type Screen = "home" | "discover" | "watch" | "prayer" | "profile";

/*
 * SCALING STRATEGY
 * Figma designs are 402px wide. Phone frame inner = 264px.
 * We use CSS zoom (264/402 ≈ 0.6567) so EVERY value below is native Figma px.
 * No manual scaling math needed — zoom handles it.
 */
const FIGMA_W = 402;
const INNER_W = 264;
const INNER_H = 591;
const ZOOM = INNER_W / FIGMA_W; // 0.6567

/* ══════════════════════════════════════════════════════════════════
   PHONE FRAME
   ══════════════════════════════════════════════════════════════════ */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 280, height: 607 }}>
      <div className="absolute inset-0 rounded-[40px] border-[6px] border-[#1a1a1a] shadow-2xl overflow-hidden" style={{ background: "#1a1a1a" }}>
        <div className="absolute top-[8px] left-1/2 -translate-x-1/2 z-50 w-[72px] h-[22px] bg-black rounded-full" />
        <div className="absolute inset-[2px] rounded-[34px] overflow-hidden bg-white">
          <div style={{ zoom: ZOOM, width: FIGMA_W, height: Math.round(INNER_H / ZOOM) }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function AppPreviewPanel({
  appName = "Your Masjid",
  brandColor = "#0A261E",
  accentColor = "#B8922A",
}: AppPreviewPanelProps) {
  const [screen, setScreen] = useState<Screen>("home");
  const bg = "#FFFBF2";
  const accent = accentColor || "#B8922A";

  const fontLink = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&family=Cormorant+Garamond:ital,wght@0,400;0,600&display=swap');`;

  return (
    <PhoneFrame>
      <style>{fontLink}</style>
      <div className="relative w-full h-full" style={{ background: bg }}>
        {screen === "home" && <HomeScreen brandColor={brandColor} accent={accent} bg={bg} appName={appName} />}
        {screen === "discover" && <DiscoverScreen brandColor={brandColor} accent={accent} bg={bg} appName={appName} />}
        {screen === "watch" && <WatchScreen brandColor={brandColor} accent={accent} bg={bg} />}
        {screen === "prayer" && <PrayerScreen brandColor={brandColor} accent={accent} bg={bg} appName={appName} />}
        {screen === "profile" && <ProfileScreen brandColor={brandColor} accent={accent} bg={bg} appName={appName} />}

        {/* ── Tab bar — Figma: 402×101, padding 16px 24px 24px, gap 8px ── */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end z-40" style={{ padding: "16px 24px 24px", gap: 8 }}>
          <div className="flex items-center justify-center w-full">
            <div
              className="flex items-center justify-center w-full rounded-[9999px]"
              style={{
                background: "rgba(255,255,255,0.2)",
                boxShadow: "0px 2px 20px rgba(0,0,0,0.1)",
                padding: 4,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {(["Home", "Discover", "Watch", "Prayer", "Profile"] as const).map((label, idx) => {
                const tabMap: Record<string, Screen> = { Home: "home", Discover: "discover", Watch: "watch", Prayer: "prayer", Profile: "profile" };
                const tabScreen = tabMap[label] || null;
                const isActive = tabScreen === screen;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => tabScreen && setScreen(tabScreen)}
                    className="flex flex-col items-center justify-center border-none outline-none"
                    style={{
                      flex: "1 0 0",
                      maxWidth: 260,
                      height: 53,
                      padding: 8,
                      gap: 2,
                      background: isActive ? "#EDEDED" : "transparent",
                      borderRadius: isActive ? 100 : 0,
                      marginRight: idx < 4 ? -10 : 0,
                      cursor: tabScreen ? "pointer" : "default",
                      opacity: tabScreen ? 1 : 0.4,
                    }}
                  >
                    <div style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TabIcon name={label} color={isActive ? "#000000" : brandColor} size={19} active={isActive} />
                    </div>
                    <span style={{
                      fontFamily: "'SF Pro', -apple-system, system-ui, sans-serif",
                      fontWeight: 400, fontSize: 10, lineHeight: "13px",
                      textAlign: "center", letterSpacing: 0.06,
                      color: isActive ? "#000000" : brandColor,
                    }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}


/* ══════════════════════════════════════════════════════════════════
   HOME SCREEN — All values are native Figma 402px
   ══════════════════════════════════════════════════════════════════ */
function HomeScreen({ brandColor, accent, bg, appName }: { brandColor: string; accent: string; bg: string; appName: string }) {
  const sf = "'SF Pro', -apple-system, system-ui, sans-serif";
  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: brandColor, scrollbarWidth: "none" }}>
      {/* ── Dark header — Figma: 393×173, +38px for dynamic island clearance ── */}
      <div className="relative" style={{ paddingTop: 44 }}>
        {/* stars removed */}
        {/* Gradient overlay from Figma Vector */}
        <div className="absolute" style={{ left: 0, right: 0, top: 0, bottom: 0, background: `linear-gradient(270.04deg, ${hexToRgba(brandColor, 0.5)} -11.25%, rgba(217,177,102,0) 41.68%)`, pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Greeting — Inter Bold 9px, ls 1.62, rgba(248,245,242,0.5) */}
          <p className="uppercase" style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, lineHeight: "11px",
            letterSpacing: 1.62, color: "rgba(248,245,242,0.5)",
            margin: 0, padding: "16px 20px 0",
          }}>
            Assalamu Alaikum D!
          </p>

          {/* Time — Playfair Display 400 45px, lh 52, ls -2 */}
          <p style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 45, lineHeight: "52px",
            letterSpacing: -2, color: "#F8F5F2",
            margin: 0, padding: "6px 20px 0",
          }}>
            4:01 PM
          </p>

          {/* Date — SF Pro 600 13px */}
          <p style={{
            fontFamily: sf, fontWeight: 600, fontSize: 13, lineHeight: "16px",
            color: "#FFFBF2", margin: 0, padding: "4px 20px 0",
          }}>
            Ramadan 13, 1447
          </p>

          {/* Next prayer — SF Pro 400 13px, gap 6 */}
          <div className="flex items-center" style={{ gap: 6, padding: "15px 24px 0" }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: "#D9B166" }} />
            <p style={{ fontFamily: sf, fontWeight: 400, fontSize: 13, lineHeight: "16px", margin: 0 }}>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Maghrib</span>
              <span style={{ color: "rgba(248,245,242,0.8)" }}> iqamah in 1h 53m</span>
            </p>
          </div>

          {/* Prayer times strip — each card 54×52, Figma y=182 (46px below next prayer) */}
          <div className="flex justify-between" style={{ padding: "46px 16px 14px" }}>
            {[
              { name: "FAJR", time: "5:14 AM", active: false, icon: "sunrise" },
              { name: "DHUHR", time: "5:14 AM", active: false, icon: "sun" },
              { name: "ASR", time: "5:14 AM", active: false, icon: "sunrise" },
              { name: "MAGHRIB", time: "5:14 AM", active: true, icon: "moon" },
              { name: "ISHA", time: "5:14 AM", active: false, icon: "crescent" },
            ].map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center"
                style={{
                  width: 54, height: 52,
                  borderRadius: p.active ? 15 : 0,
                  border: p.active ? `0.5px solid ${hexToRgba(accent, 0.1)}` : "none",
                  background: p.active ? hexToRgba(accent, 0.2) : "transparent",
                  position: "relative",
                }}
              >
                {/* Name — SF Pro 590 8px, ls 0.4, #8B9994 */}
                <span className="uppercase" style={{
                  fontFamily: sf, fontWeight: 590, fontSize: 8, lineHeight: "10px",
                  letterSpacing: 0.4, color: p.active ? accent : "#8B9994",
                  marginTop: 4,
                }}>
                  {p.name}
                </span>
                {/* Icon — 17×17 or 18×18 */}
                <div style={{ margin: "2px 0" }}>
                  <PrayerIcon type={p.icon} size={17} color={p.active ? accent : "#8B9994"} />
                </div>
                {/* Time — SF Pro 590 10px */}
                <span style={{
                  fontFamily: sf, fontWeight: 590, fontSize: 10, lineHeight: "12px",
                  color: p.active ? accent : "#FFFBF2",
                }}>
                  {p.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Light body — Figma: bg #FFFBF2, borderRadius 48px, starts at y=270 ── */}
      <div style={{ background: bg, borderRadius: "48px 48px 0 0", marginTop: 0, position: "relative", zIndex: 1, paddingTop: 12, color: brandColor }}>

        {/* Donate banner — Figma: h64, padding 14px 18px, bg brand, radius 50, inset shadow */}
        <DonateBanner brandColor={brandColor} accent={accent} appName={appName} filledButton />

        {/* Today's Events header — SF Pro 590 13px, gap 170 */}
        <SectionHeader title="TODAY'S EVENTS" right="MAR 9, 2026" accent={accent} divider />

        {/* Event rows — each 58px tall */}
        <div style={{ padding: "0 22px" }}>
          {[
            { time: "5:00 PM", name: "MAS SI Soccer Program", tag: "Sports & Youth" },
            { time: "5:00 PM", name: "Soulful Saturdays", tag: "Kids" },
            { time: "5:00 PM", name: "MAS SI Soccer Program", tag: "Sports & Youth" },
          ].map((ev, i) => (
            <div
              key={i}
              className="flex items-center"
              style={{
                height: 58, position: "relative",
                borderBottom: i < 2 ? "0.5px solid rgba(10,38,30,0.1)" : "none",
              }}
            >
              {/* Time — SF Pro 510 12px, lh 14, text-align right, width 49 */}
              <span style={{
                fontFamily: sf, fontWeight: 510, fontSize: 12, lineHeight: "14px",
                color: brandColor, width: 49, textAlign: "right", flexShrink: 0,
              }}>
                {ev.time}
              </span>
              {/* Name — SF Pro 510 12px, left 97 from row start (gap ~30px) */}
              <span style={{
                fontFamily: sf, fontWeight: 510, fontSize: 12, lineHeight: "14px",
                color: brandColor, marginLeft: 32, flex: 1,
              }}>
                {ev.name}
              </span>
              {/* Tag — SF Pro 400 9px, #B8922A, pill */}
              <span style={{
                fontFamily: sf, fontWeight: 400, fontSize: 9, lineHeight: "11px",
                color: accent, padding: "3px 9px", borderRadius: 100, flexShrink: 0,
              }}>
                {ev.tag}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 0.5, background: "rgba(10,38,30,0.1)", margin: "0 22px" }} />

        {/* Featured card — 361×109, bg brand, radius 16 */}
        <div style={{
          background: brandColor, borderRadius: 16, margin: "16px 20px",
          padding: "16px 24px 18px", position: "relative", overflow: "hidden",
        }}>
          {/* Tag — SF Pro 400 9px, pill */}
          <span style={{
            fontFamily: sf, fontWeight: 400, fontSize: 9, lineHeight: "11px",
            color: accent, display: "inline-block", borderRadius: 100, padding: "3px 9px",
          }}>
            Featured
          </span>
          {/* Title — Playfair Display Bold 15px, lh 18, #F8F5F2 */}
          <p style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, lineHeight: "18px",
            color: "#F8F5F2", margin: "6px 0 2px",
          }}>
            Weekend Islamic School
          </p>
          {/* Meta — Inter 400 10px, lh 12, #5C6E67 */}
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px",
            color: "#5C6E67", margin: 0,
          }}>
            Saturdays & Sundays · 10:00 AM – 1:00 PM
          </p>
        </div>

        {/* Quick Actions — cards 66×63, radius 20, shadow, labels 8px bold ls 1 */}
        <div className="flex justify-between" style={{ padding: "8px 28px 0" }}>
          {[
            { label: "DONATE", icon: <DonateIcon color={brandColor} /> },
            { label: "VOLUNTEER", icon: <VolunteerIcon color={brandColor} /> },
            { label: "ADVERTISE", icon: <AdvertiseIcon color={brandColor} /> },
            { label: "PRAYERS", icon: <PrayersIcon color={brandColor} /> },
          ].map((a) => (
            <div key={a.label} className="flex flex-col items-center" style={{ gap: 6, width: 66 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 66, height: 63, borderRadius: 20, background: "#F1EDE4",
                  border: "0.5px solid rgba(10,38,30,0.1)",
                  boxShadow: "0px 6px 14px rgba(0,0,0,0.02)",
                }}
              >
                {a.icon}
              </div>
              <span className="uppercase" style={{
                fontFamily: sf, fontWeight: 700, fontSize: 8, lineHeight: "10px",
                letterSpacing: 1, color: "rgba(10,38,30,0.6)",
              }}>
                {a.label}
              </span>
            </div>
          ))}
        </div>

        {/* Programs — thumbnails 50×50 radius 10, text SF Pro 590 10px */}
        <SectionHeader title="PROGRAMS" right="See all →" divider />
        <ProgramsList brandColor={brandColor} accent={accent} />

        {/* Recommended — cards 220×196 radius 14, text 13px 590 */}
        <SectionHeader title="RECOMMENDED FOR YOU" right="See all →" divider />
        <RecommendedCards brandColor={brandColor} />

        {/* Community Partners */}
        <SectionHeader title="COMMUNITY PARTNERS" divider />
        <div style={{ padding: "8px 20px" }}>
          {/* Image placeholder — 352×215, radius 16 */}
          <div className="overflow-hidden relative" style={{ borderRadius: 16, height: 215, background: "linear-gradient(135deg, #D4C9B5 0%, #C8BDA8 50%, #BCB29C 100%)" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p style={{ fontSize: 20, fontWeight: 800, color: "#1a5c3a", margin: 0, fontFamily: "'Playfair Display', serif" }}>K&A</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#c41e3a", margin: 0 }}>SANDWICH CITY</p>
                <p style={{ fontSize: 8, color: "rgba(10,38,30,0.6)", margin: "3px 0 0", fontStyle: "italic" }}>Always fresh! Always Made Your Way!</p>
                <p style={{ fontFamily: sf, fontSize: 8, fontWeight: 700, color: "#c41e3a", margin: "4px 0 0" }}>BREAKFAST · LUNCH · DINNER</p>
              </div>
            </div>
          </div>
          {/* Address — Inter 400 10px */}
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px", color: brandColor, margin: "8px 0 0" }}>
            1805 Forest Ave @ Richmond Ave.,{"\n"}Staten Island, NY 10303
          </p>
          {/* Actions row */}
          <div className="flex items-center" style={{ marginTop: 8, gap: 8 }}>
            {/* Directions — 92×26, border 0.5px brand, radius 100 */}
            <div className="flex items-center gap-[6px] rounded-full" style={{ border: `0.5px solid ${brandColor}`, padding: "7px 14px", height: 26 }}>
              <PinIcon size={14} color={brandColor} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 9, lineHeight: "11px", color: brandColor }}>Directions</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {/* 26×26 circle buttons */}
              <CircleButton><ShareIcon size={12} color={brandColor} /></CircleButton>
              <CircleButton><LinkIcon size={12} color={brandColor} /></CircleButton>
              <CircleButton><MessageIcon size={12} color={brandColor} /></CircleButton>
            </div>
          </div>
        </div>

        {/* Become a Community Partner — bg brand, radius 50, SF Pro 400 14px */}
        <div style={{ padding: "16px 20px 0" }}>
          <div className="flex items-center justify-center rounded-[50px]" style={{ background: brandColor, padding: "14px 18px", boxShadow: "0px 4px 16px rgba(0,0,0,0.03)" }}>
            <span style={{ fontFamily: sf, fontWeight: 400, fontSize: 14, lineHeight: "17px", color: "#FFFBF2" }}>Become a Community Partner →</span>
          </div>
        </div>

        <div style={{ height: 110 }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DISCOVER SCREEN
   ══════════════════════════════════════════════════════════════════ */
function DiscoverScreen({ brandColor, accent, bg, appName }: { brandColor: string; accent: string; bg: string; appName: string }) {
  const sf = "'SF Pro', -apple-system, system-ui, sans-serif";
  /* Figma: container bg #0A261E radius 48, cream rect starts at y=39 */
  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: brandColor, scrollbarWidth: "none" }}>
      {/* Cream body — Figma: top 39px, bg #FFFBF2 */}
      <div style={{ background: bg, marginTop: 39, minHeight: "100%", color: brandColor }}>

        {/* "Discover" title — Figma: Playfair 500 30px, lh 52, at y=53 (14px from cream top) */}
        <p style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: 30, lineHeight: "52px",
          color: brandColor, margin: 0, padding: "14px 22px 0",
        }}>
          Discover
        </p>

        {/* Tabs — Figma: y=114, SF Pro 12px, lh 14 */}
        {/* Tab positions: All@22, For You@58, Events@122, Programs@181, Search@358 */}
        <div className="flex items-center" style={{ padding: "9px 22px 0" }}>
          {[
            { label: "All", left: 0 },
            { label: "For You", left: 36 },
            { label: "Events", left: 100 },
            { label: "Programs", left: 159 },
          ].map((tab, i) => (
            <div key={tab.label} className="relative" style={{ marginRight: i === 0 ? 20 : i === 1 ? 20 : i === 2 ? 20 : 0 }}>
              <span style={{
                fontFamily: sf, fontSize: 12, lineHeight: "14px",
                fontWeight: i === 0 ? 590 : 510,
                color: i === 0 ? brandColor : "rgba(10,38,30,0.6)",
              }}>
                {tab.label}
              </span>
              {/* Active underline — Figma: Line 31, width 16, top 131 (17px below tab text) */}
              {i === 0 && <div style={{ position: "absolute", bottom: -7, left: 0, width: 16, height: 1, background: brandColor }} />}
            </div>
          ))}
          <div style={{ marginLeft: "auto" }}><SearchIcon size={18} color="rgba(10,38,30,0.4)" /></div>
        </div>

        {/* "Recommended for you" — Figma: section starts ~y=165 */}
        <SectionHeader title="RECOMMENDED FOR YOU" right="SEE ALL →" divider />
        {/* Cards — Figma: 220×196, radius 14, text 13px 590 */}
        <RecommendedCards brandColor={brandColor} tall />

        {/* "Upcoming events" — Figma: section starts ~y=474 */}
        <SectionHeader title="UPCOMING EVENTS" right="VIEW CALENDAR" divider calendarIcon />
        {/* Rows with 50×50 thumbnails, SF Pro 590 10px */}
        <ProgramsList brandColor={brandColor} accent={accent} />

        {/* "Programs" category cards — Figma: section starts ~y=783 */}
        <SectionHeader title="PROGRAMS" right="SEE ALL →" divider />
        {/* Cards: 149-153×217, radius 14-16, labels 13px 510 */}
        <div className="flex gap-[13px]" style={{ padding: "8px 16px", overflow: "hidden" }}>
          {[
            { label: "Kids", bg: "linear-gradient(145deg, #FAF5EC 0%, #F0E8D8 100%)", art: <CrescentArt />, border: true },
            { label: "Youth", bg: "linear-gradient(145deg, #2C4A3A 0%, #1A3528 100%)", art: <BookArt /> },
            { label: "Adults", bg: "linear-gradient(145deg, #4A6040 0%, #3A5030 100%)", art: <WheatArt /> },
          ].map((cat) => (
            <div key={cat.label} className="flex-1 min-w-0">
              <div
                className="rounded-[16px] relative overflow-hidden flex items-center justify-center"
                style={{
                  width: "100%", height: 217, background: cat.bg,
                  border: cat.border ? "0.5px solid rgba(10,38,30,0.1)" : "none",
                }}
              >
                {cat.art}
              </div>
              <p style={{ fontFamily: sf, fontSize: 13, fontWeight: 510, lineHeight: "16px", color: brandColor, margin: "6px 0 0" }}>{cat.label}</p>
            </div>
          ))}
        </div>

        {/* Donate banner — Figma: y=1145, left 24, right 20 */}
        <div style={{ padding: "14px 4px 0" }}>
          <DonateBanner brandColor={brandColor} accent={accent} appName={appName} filledButton />
        </div>

        <div style={{ height: 110 }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRAYER SCREEN
   ══════════════════════════════════════════════════════════════════ */
function PrayerScreen({ brandColor, accent, bg, appName }: { brandColor: string; accent: string; bg: string; appName: string }) {
  const sf = "'SF Pro', -apple-system, system-ui, sans-serif";
  const prayers = [
    { name: "Fajr", athan: "5:50 AM", iqamah: "6:10 AM", passed: true, icon: "sunrise" as const },
    { name: "Dhuhr", athan: "1:05 PM", iqamah: "1:15 PM", next: true, icon: "sun" as const },
    { name: "Asr", athan: "4:28 PM", iqamah: "5:00 PM", icon: "sunrise" as const },
    { name: "Maghrib", athan: "7:05 PM", iqamah: "7:10 PM", icon: "moon" as const },
    { name: "Isha", athan: "8:20 PM", iqamah: "8:30 PM", icon: "crescent" as const },
  ];
  const progress = 0.45;


  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: brandColor, scrollbarWidth: "none" }}>
      {/* stars removed */}

      {/* Countdown clock — Figma: 292×292 at (55, 90) */}
      <div className="flex flex-col items-center" style={{ paddingTop: 66, position: "relative", zIndex: 1 }}>
        <p style={{ fontFamily: sf, fontWeight: 590, fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>ASR IN</p>

        {/* Clock — Figma: outer 292px, inner 227px bg #071F18, ring 4px #B8922A */}
        <div className="relative" style={{ width: 292, height: 292, marginTop: 4 }}>
          {/* Outer shadow circle */}
          <div className="absolute rounded-full" style={{
            width: 292, height: 292, background: brandColor,
            boxShadow: "36px 14px 30px 9px rgba(18,65,52,0.2), -44px -7px 40px 15px rgba(0,0,0,0.25)",
          }} />
          {/* Dashed rings */}
          <div className="absolute rounded-full" style={{ width: 251, height: 251, left: 20, top: 20, border: "2px dashed rgba(255,255,255,0.3)" }} />
          {/* Inner dark circle */}
          <div className="absolute rounded-full" style={{ width: 227, height: 227, left: 32, top: 32, background: darkenHex(brandColor, 0.3) }} />
          {/* Gold progress arc */}
          <svg className="absolute" style={{ left: 20, top: 20, width: 252, height: 252 }}>
            <circle cx="126" cy="126" r="104" fill="none" stroke={accent} strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 104}`}
              strokeDashoffset={`${2 * Math.PI * 104 * (1 - progress)}`}
              strokeLinecap="round" transform="rotate(-90 126 126)" />
          </svg>
          {/* Orbital dots — Figma frame positions (left,top) offset by clock origin (55,90) */}
          {/* Ellipse 68: (98,285) → silver dot bottom-left */}
          <div className="absolute rounded-full" style={{ width: 10, height: 10, left: 43, top: 195, background: "#D9D9D9", boxShadow: "0px 4px 10px #B8922A" }} />
          {/* Ellipse 70: (85,251) → gold dot left */}
          <div className="absolute rounded-full" style={{ width: 10, height: 10, left: 30, top: 161, background: accent, boxShadow: "1px 1px 10px rgba(184,146,42,0.4)" }} />
          {/* Ellipse 71: (99,175) → ring dot upper-left */}
          <div className="absolute rounded-full" style={{ width: 10, height: 10, left: 44, top: 85, border: "1px solid rgba(255,255,255,0.4)" }} />
          {/* Ellipse 72: (139,133) → ring dot top */}
          <div className="absolute rounded-full" style={{ width: 10, height: 10, left: 84, top: 43, border: "1px solid rgba(255,255,255,0.4)", filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.25))" }} />
          {/* Ellipse 69: (194,343) → faded dot bottom-right */}
          <div className="absolute rounded-full" style={{ width: 11, height: 11, left: 139, top: 253, background: "rgba(184,146,42,0.2)" }} />
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p style={{ fontFamily: sf, fontWeight: 400, fontSize: 45, lineHeight: "54px", color: "#FAF9F4", margin: 0 }}>00:22</p>
          </div>
        </div>

        {/* "14:14 CURRENT" — Figma: Inter 800 11px, bg transparent, radius 100 */}
        <div className="rounded-full" style={{ padding: "7px 14px", marginTop: 4, background: "rgba(0,0,0,0.004)", borderRadius: 100 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 11, lineHeight: "13px", color: accent }}>14:14 CURRENT</span>
        </div>
      </div>

      {/* "Prayer Times" — Figma: Playfair 400 40px, lh 52, at y=429 */}
      <p style={{
        fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 40, lineHeight: "52px",
        color: "#FFFBF2", textAlign: "center", margin: "24px 0 0",
      }}>
        Prayer Times
      </p>

      {/* Date selector — Figma: 360×68, bg #071F18, radius 20, left 21, top 528 */}
      <div className="flex items-center justify-between" style={{
        background: darkenHex(brandColor, 0.3), borderRadius: 20,
        margin: "18px 21px 0", padding: "14px 16px", height: 68,
      }}>
        <ChevronLeft color="white" size={14} />
        <div className="text-center">
          <p className="uppercase" style={{ fontFamily: sf, fontWeight: 590, fontSize: 10, letterSpacing: "0.018em", color: "#FAF9F4", margin: 0 }}>THURSDAY, MAR, 2026</p>
          <p style={{ fontFamily: sf, fontWeight: 400, fontSize: 10, letterSpacing: "0.018em", color: accent, margin: "2px 0 0" }}>Ramadan 30, 1447</p>
        </div>
        <ChevronRight color="white" size={14} />
      </div>

      {/* Column headers — Figma: PRAYER@76, ATHAN@197, IQAMAH@276 */}
      <div className="flex items-center" style={{ padding: "18px 24px 8px" }}>
        <span style={{ fontFamily: sf, fontWeight: 590, fontSize: 10, lineHeight: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.018em", width: 54 }}>PRAYER</span>
        <span style={{ fontFamily: sf, fontSize: 10, lineHeight: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.018em", flex: 1, textAlign: "center" }}>ATHAN</span>
        <span style={{ fontFamily: sf, fontSize: 10, lineHeight: "12px", color: "rgba(255,255,255,0.4)", flex: 1, textAlign: "center" }}>IQAMAH</span>
      </div>

      {/* Prayer rows — Figma: each 65px, 343-359px wide, radius 20 */}
      <div style={{ padding: "0 22px" }}>
        {prayers.map((p, i) => {
          const dimmed = p.passed ? "rgba(255,255,255,0.4)" : undefined;
          const textColor = dimmed || "#FAF9F4";
          return (
            <div key={p.name}>
              <div className="flex items-center" style={{
                height: 65,
                paddingLeft: p.next ? 4 : 6,
                paddingRight: p.next ? 12 : 6,
                borderRadius: 20,
                background: p.next ? "rgba(217,177,102,0.1)" : "transparent",
              }}>
                {/* Icon — Figma: 36×36 container, radius 12, icon 20×20 */}
                <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 12 }}>
                  <PrayerIcon type={p.icon} size={20} color={dimmed || (p.next ? accent : "#FAF9F4")} />
                </div>
                {/* Name + status — Figma: name at x=76 (54px from icon container start) */}
                <div style={{ minWidth: 60, marginLeft: 4 }}>
                  <span style={{ fontFamily: sf, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: textColor, display: "block" }}>{p.name}</span>
                  {p.passed && <span style={{ fontFamily: sf, fontWeight: 400, fontSize: 8, lineHeight: "10px", color: "#6C7D78", display: "block", marginTop: 1 }}>Passed</span>}
                  {p.next && <span style={{ fontFamily: sf, fontWeight: 400, fontSize: 8, lineHeight: "10px", color: accent, display: "block", marginTop: 1 }}>Next in 0h 55m</span>}
                </div>
                {/* Athan — Figma: at x≈197, 13px, centered */}
                <span style={{ fontFamily: sf, fontWeight: 400, fontSize: 13, lineHeight: "16px", flex: 1, textAlign: "center", color: dimmed || "white" }}>{p.athan}</span>
                {/* Iqamah — Figma: at x≈276, 13px, active is 590 weight + gold */}
                <span style={{ fontFamily: sf, fontSize: 13, lineHeight: "16px", fontWeight: p.next ? 590 : 400, color: dimmed || (p.next ? accent : "#FAF9F4"), flex: 1, textAlign: "center" }}>{p.iqamah}</span>
                {/* Bell — outline on normal rows, filled gold on active */}
                <div className="flex items-center justify-center shrink-0" style={{ width: 20 }}>
                  <BellDotIcon size={14} color={dimmed || accent} filled={!!p.next} />
                </div>
              </div>
              {/* Divider — Figma: 1px solid #163129 */}
              {i < 4 && <div style={{ height: 1, background: darkenHex(brandColor, 0.5), margin: "0 2px" }} />}
            </div>
          );
        })}
      </div>

      {/* ═══ Combined Daily Quran Goal + Remembrances card ═══
           Figma: 357×377, bg #071F18, radius 20, shadow 0 4px 10px rgba(0,0,0,0.1) */}
      <div style={{
        background: darkenHex(brandColor, 0.3), borderRadius: 20,
        margin: "22px 24px 0", padding: "16px 0 20px",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
      }}>
        {/* Heart icon */}
        <div className="flex items-center justify-center" style={{ marginBottom: 0 }}>
          <div className="flex items-center justify-center shrink-0" style={{ width: 31, height: 29, borderRadius: 28, background: hexToRgba(accent, 0.2) }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: accent, lineHeight: "18px", textAlign: "center" }}>♥</span>
          </div>
        </div>
        {/* "Daily Quran Goal" — Playfair 25px, lh 52 */}
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 25, lineHeight: "52px", color: "#FFFBF2", textAlign: "center", margin: 0 }}>Daily Quran Goal</p>

        {/* Content row */}
        <div className="flex items-center justify-between" style={{ padding: "0 32px 0 27px" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: sf, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: "#FFFBF2", margin: 0, letterSpacing: "0.018em" }}>Surah Al-Kahf</p>
            <p style={{ fontFamily: sf, fontSize: 10, lineHeight: "12px", color: "rgba(255,255,255,0.4)", margin: "4px 0 0", letterSpacing: "0.018em" }}>
              Verse 42-50 · <span style={{ color: accent }}>Just 8 left</span>
            </p>
            {/* "Continue Reading" — Figma: 121×23, bg rgba(255,255,255,0.05), border, radius 20 */}
            <div className="flex items-center justify-center" style={{
              width: 121, height: 23, borderRadius: 20,
              background: "rgba(255,255,255,0.05)", border: `0.5px solid ${hexToRgba(accent, 0.1)}`,
              marginTop: 10,
            }}>
              <span style={{ fontFamily: sf, fontWeight: 590, fontSize: 8, lineHeight: "10px", color: "white", letterSpacing: "0.018em" }}>Continue Reading</span>
            </div>
          </div>
          {/* Progress ring — Figma: 64.5×64.5, border 5px */}
          <div className="relative shrink-0" style={{ width: 65, height: 65 }}>
            <svg width="65" height="65" viewBox="0 0 65 65">
              <circle cx="32.5" cy="32.5" r="28" fill="none" stroke="rgba(0,0,0,1)" strokeWidth="5" />
              <circle cx="32.5" cy="32.5" r="27.5" fill="none" stroke={accent} strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 27.5}`} strokeDashoffset={`${2 * Math.PI * 27.5 * 0.26}`}
                strokeLinecap="round" transform="rotate(-90 32.5 32.5)" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 25, lineHeight: "52px", color: "white" }}>74%</span>
            </div>
          </div>
        </div>

        {/* Divider — Figma: Line 42, 313px, #163129 */}
        <div style={{ height: 1, background: "#163129", margin: "16px 24px" }} />

        {/* "Remembrances" — Playfair 25px */}
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 25, lineHeight: "52px", color: "#FFFBF2", textAlign: "center", margin: 0 }}>Remembrances</p>

        {/* Morning / Evening cards — Figma: 152×68, radius 20 */}
        <div className="flex" style={{ padding: "4px 18px 0", position: "relative" }}>
          {/* Vertical divider — Figma: Line 39, rotated 90deg, #163129 */}
          <div style={{ position: "absolute", top: 12, bottom: 12, left: "50%", width: 1, background: "#163129" }} />
          {[
            { name: "Morning Athkar", count: "42 Prayers · 12m", icon: "sun" as const },
            { name: "Evening Atkhkar", count: "42 Prayers · 12m", icon: "crescent" as const },
          ].map((item, i) => (
            <div key={item.name} style={{ flex: 1, padding: i === 0 ? "8px 16px 8px 6px" : "8px 6px 8px 16px", borderRadius: 20 }}>
              <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 12 }}>
                <PrayerIcon type={item.icon} size={20} color="rgba(255,255,255,0.7)" />
              </div>
              <p style={{ fontFamily: sf, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: "#FFFBF2", margin: "4px 0 0", letterSpacing: "0.018em" }}>{item.name}</p>
              <p style={{ fontFamily: sf, fontSize: 10, lineHeight: "12px", color: "rgba(255,255,255,0.4)", margin: "4px 0 0", letterSpacing: "0.018em" }}>{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Donate banner — Figma: y=1485, bg #071F18, transparent button */}
      <div className="flex items-center justify-between relative" style={{
        background: darkenHex(brandColor, 0.3), borderRadius: 50, margin: "20px 24px 0",
        padding: "14px 18px", height: 64,
      }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 28, background: hexToRgba(accent, 0.2) }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, lineHeight: "24px", color: accent, textAlign: "center", width: 36 }}>♥</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <p style={{ fontFamily: sf, fontWeight: 700, fontSize: 14, lineHeight: "17px", color: "#F0EDE6", margin: 0 }}>Support {appName}</p>
            <p style={{ fontFamily: sf, fontWeight: 500, fontSize: 10, lineHeight: "12px", color: "rgba(240,237,230,0.55)", margin: 0 }}>Donate</p>
          </div>
        </div>
        {/* Figma: bg transparent (rgba(0,0,0,0.004)), text #B8922A */}
        <div className="rounded-full shrink-0 flex items-center" style={{ background: "rgba(0,0,0,0.004)", padding: "7px 14px", borderRadius: 100 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 11, lineHeight: "13px", color: accent }}>DONATE →</span>
        </div>
      </div>

      {/* Community Partners — Figma: y=1586, bg #071F18 cards */}
      <div style={{ padding: "14px 28px 0" }}>
        <div style={{ borderTop: "1px solid #FFFBF2", opacity: 0.08, marginBottom: 8 }} />
        <p className="uppercase" style={{ fontFamily: sf, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: "#FFFBF2", margin: "0 0 8px" }}>Community Partners</p>
        <div className="overflow-hidden relative" style={{ borderRadius: 16, height: 215, background: darkenHex(brandColor, 0.3) }}>
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D4C9B5 0%, #BCB29C 100%)", borderRadius: 16 }}>
            <div className="text-center">
              <p style={{ fontSize: 20, fontWeight: 800, color: "#1a5c3a", margin: 0, fontFamily: "'Playfair Display', serif" }}>K&A</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#c41e3a", margin: 0 }}>SANDWICH CITY</p>
            </div>
          </div>
        </div>
        {/* Address — Inter 400 10px, #FFFBF2 */}
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px", color: "#FFFBF2", margin: "8px 0 0" }}>
          1805 Forest Ave @ Richmond Ave.,{"\n"}Staten Island, NY 10303
        </p>
        <div className="flex items-center" style={{ marginTop: 8, gap: 8 }}>
          <div className="flex items-center gap-[6px] rounded-full" style={{ border: "0.5px solid #FFFBF2", padding: "7px 14px", height: 26 }}>
            <PinIcon size={14} color="#FFFBF2" />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 9, color: "#FFFBF2" }}>Directions</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <CircleButton dark><ShareIcon size={11} color="#FFFBF2" /></CircleButton>
            <CircleButton dark><LinkIcon size={11} color="#FFFBF2" /></CircleButton>
            <CircleButton dark><MessageIcon size={11} color="#FFFBF2" /></CircleButton>
          </div>
        </div>
      </div>

      {/* "Become a Community Partner" — Figma: bg #071F18, radius 50 */}
      <div style={{ padding: "12px 20px 0" }}>
        <div className="flex items-center justify-center rounded-[50px]" style={{ background: darkenHex(brandColor, 0.3), padding: "14px 18px" }}>
          <span style={{ fontFamily: sf, fontWeight: 400, fontSize: 14, lineHeight: "17px", color: "#FFFBF2" }}>Become a Community Partner →</span>
        </div>
      </div>
      <div style={{ height: 110 }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   WATCH / REELS SCREEN — Figma: "liked/saved - shorts"
   ══════════════════════════════════════════════════════════════════ */
function WatchScreen({ brandColor, accent, bg }: { brandColor: string; accent: string; bg: string }) {
  const sf = "'SF Pro', -apple-system, system-ui, sans-serif";
  return (
    <div className="w-full h-full relative" style={{ background: "#000", overflow: "hidden" }}>
      {/* Fake video image — mosque interior placeholder */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, #1a3a2a 0%, #0d2018 30%, #2a4a3a 60%, #0a1a12 100%)`,
      }}>
        {/* Simulated mosque interior silhouette */}
        <div className="absolute" style={{ bottom: "30%", left: "50%", transform: "translateX(-50%)", width: 300, height: 200, opacity: 0.15 }}>
          {/* Dome shape */}
          <div style={{ width: 120, height: 80, borderRadius: "60px 60px 0 0", background: "white", margin: "0 auto" }} />
          {/* Pillars */}
          <div className="flex justify-center" style={{ gap: 30, marginTop: -2 }}>
            <div style={{ width: 16, height: 100, background: "white", borderRadius: 2 }} />
            <div style={{ width: 16, height: 100, background: "white", borderRadius: 2 }} />
            <div style={{ width: 16, height: 100, background: "white", borderRadius: 2 }} />
          </div>
        </div>
        {/* Warm light glow */}
        <div className="absolute" style={{ top: "25%", left: "40%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,177,102,0.08) 0%, transparent 70%)" }} />
        {/* Top/bottom vignette */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.7) 100%)" }} />
      </div>

      {/* Top bar */}
      <div className="relative" style={{ zIndex: 2, paddingTop: 54 }}>
        {/* Saved / Liked tabs — Figma: SF Pro 13px */}
        <div className="flex items-center" style={{ padding: "0 29px", gap: 16 }}>
          <span style={{ fontFamily: sf, fontWeight: 400, fontSize: 13, lineHeight: "16px", color: "rgba(255,255,255,0.6)" }}>Saved</span>
          <div className="relative">
            <span style={{ fontFamily: sf, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: "#FFFFFF" }}>Liked</span>
            <div style={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: 1, background: "#FFFFFF" }} />
          </div>
          {/* Search icon top-right */}
          <div style={{ marginLeft: "auto" }}>
            <SearchIcon size={18} color="rgba(255,255,255,0.6)" />
          </div>
        </div>
      </div>

      {/* Right side interaction icons */}
      <div className="absolute flex flex-col items-center" style={{ right: 20, bottom: 180, gap: 22, zIndex: 3 }}>
        <div className="flex flex-col items-center" style={{ gap: 4 }}>
          <span style={{ fontSize: 23, color: "#FF0005" }}>♥</span>
          <span style={{ fontFamily: sf, fontWeight: 590, fontSize: 10, lineHeight: "12px", color: "#FFFFFF" }}>1.1k</span>
        </div>
        <svg width={19} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFBF2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFBF2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
        <span style={{ fontSize: 20, color: "#FFFFFF", letterSpacing: 2 }}>···</span>
      </div>

      {/* Bottom speaker card */}
      <div className="absolute" style={{ left: 20, right: 20, bottom: 120, zIndex: 3 }}>
        <div className="flex items-center" style={{
          background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          borderRadius: 15, padding: "12px 14px", gap: 10,
        }}>
          <div className="rounded-full shrink-0 overflow-hidden" style={{ width: 40, height: 40, background: "#5A6652" }}>
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "white" }}>Y</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: sf, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: "#FFFFFF", margin: 0 }}>Sheikh Yusuf Rahman</p>
            <p style={{ fontFamily: sf, fontWeight: 400, fontSize: 10, lineHeight: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>MAS Staten Island</p>
          </div>
          <div className="rounded-[20px] shrink-0 flex items-center justify-center" style={{
            background: "#FDF9F0", border: "0.5px solid #FFFFFF", padding: "6px 14px",
          }}>
            <span style={{ fontFamily: sf, fontWeight: 590, fontSize: 10, lineHeight: "12px", color: brandColor }}>Visit</span>
          </div>
        </div>
        <p style={{ fontFamily: sf, fontWeight: 400, fontSize: 10, lineHeight: "12px", color: "#FFFFFF", margin: "8px 0 0", padding: "0 15px" }}>
          Every Soul will taste death | Sheikh Yusuf Rahman | Must...
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PROFILE SCREEN
   ══════════════════════════════════════════════════════════════════ */
function ProfileScreen({ brandColor, accent, bg, appName }: { brandColor: string; accent: string; bg: string; appName: string }) {
  const sf = "'SF Pro', -apple-system, system-ui, sans-serif";
  return (
    <div className="w-full h-full overflow-y-auto" style={{ background: brandColor, scrollbarWidth: "none" }}>
      {/* Header — Figma: 148px bg, avatar at y=34, name at y=102, buttons at y=~140 */}
      <div className="relative overflow-hidden" style={{ paddingTop: 44, paddingBottom: 30 }}>
        {/* stars removed */}
        <svg viewBox="0 0 340 180" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }} fill="none">
          <path d="M170 180 Q170 60 40 30 Q-20 15 -30 0 L370 0 Q360 15 300 30 Q170 60 170 180Z" fill="white" />
        </svg>
        <div className="flex flex-col items-center w-full" style={{ position: "relative", zIndex: 1 }}>
          {/* Avatar — 57×57 */}
          <div className="flex items-center justify-center rounded-full overflow-hidden" style={{ width: 57, height: 57, background: "#5A6652" }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "white" }}>D</span>
          </div>
          {/* Name — Cormorant Garamond SemiBold 20px */}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 20, color: "#FFFBF2", margin: "6px 0 0" }}>Dee Chauhan</p>
          <p style={{ fontFamily: sf, fontWeight: 400, fontSize: 8, color: "rgba(255,251,242,0.6)", margin: "1px 0 0" }}>Member Since 2026</p>
          {/* Buttons */}
          <div className="flex gap-[6px]" style={{ marginTop: 8 }}>
            <div className="flex items-center gap-[5px] rounded-full" style={{ border: `0.5px solid ${hexToRgba(accent, 0.5)}`, padding: "4px 14px" }}>
              <div className="rounded-full" style={{ width: 4, height: 4, background: accent }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, color: accent }}>Complete Profile</span>
            </div>
            <div className="flex items-center rounded-full" style={{ border: "0.5px solid rgba(255,251,242,0.5)", padding: "4px 14px" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, color: "#FFFBF2" }}>Edit Profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Light body — radius 48 */}
      <div style={{ background: bg, borderRadius: "48px 48px 0 0", marginTop: -14, position: "relative", zIndex: 1, color: brandColor, paddingTop: 6 }}>
        {/* Personalize Preferences — Figma: 352×53, at y=211, rounded 30 */}
        <div className="flex items-center justify-between" style={{
          background: hexToRgba(accent, 0.2), borderRadius: 30,
          margin: "14px 24px 0", padding: "14px 16px", height: 53,
        }}>
          <div className="flex items-center gap-[10px]">
            <SettingsIcon size={16} color={brandColor} />
            <div>
              <p style={{ fontFamily: sf, fontWeight: 590, fontSize: 11, lineHeight: "18px", color: brandColor, margin: 0 }}>Personalize Preferences</p>
              <p style={{ fontFamily: sf, fontWeight: 400, fontSize: 10, lineHeight: "18px", color: "rgba(10,38,30,0.6)", margin: 0 }}>Get your content recommended just for you</p>
            </div>
          </div>
          <ChevronRight color="rgba(10,38,30,0.3)" size={8} />
        </div>

        <ProfileSection title="COMMUNITY"><ProfileRow icon={<PersonAddIcon size={15} color={brandColor} />} label="Invite friends" dashed /></ProfileSection>
        <ProfileSection title="MY ACTIVITY">
          <ProfileRow icon={<BookmarkIcon size={13} color={brandColor} />} label="Saved Programs & Events" />
          <ProfileRow icon={<PlaylistIcon size={13} color={brandColor} />} label="Saved Clips" />
          <ProfileRow icon={<InvoiceIcon size={14} color={brandColor} />} label="Payment History" />
          <ProfileRow icon={<CreditCardIcon size={14} color={brandColor} />} label="Payment Methods" last />
        </ProfileSection>
        <DonateBanner brandColor={brandColor} accent={accent} appName={appName} filledButton />
        <ProfileSection title="NOTIFICATIONS">
          <div className="flex items-center justify-between" style={{
            background: hexToRgba(accent, 0.2), borderRadius: 14,
            border: `0.5px dashed ${hexToRgba(accent, 0.2)}`, padding: "14px 16px", margin: "0 0 6px", height: 49,
          }}>
            <div className="flex items-center gap-[8px]">
              <BellIcon size={13} color={accent} />
              <span style={{ fontFamily: "'SF Pro', -apple-system, system-ui, sans-serif", fontWeight: 510, fontSize: 11, color: accent }}>Push Notifications are off</span>
            </div>
            <span style={{ fontFamily: "'SF Pro', -apple-system, system-ui, sans-serif", fontWeight: 400, fontSize: 11, color: accent }}>Enable ›</span>
          </div>
          <ProfileRow icon={<BellIcon size={12} color={brandColor} />} label="Prayer Alerts" />
          <ProfileRow icon={<CalendarCheckIcon size={14} color={brandColor} />} label="Programs" />
          <ProfileRow icon={<CalendarIcon size={14} color={brandColor} />} label="Events" last />
        </ProfileSection>
        <ProfileSection title="MAS SHOP"><ProfileRow icon={<ShoppingBagIcon size={14} color={brandColor} />} label="Programs / Events Shop" last /></ProfileSection>
        <ProfileSection title="BUSINESS ADS">
          <ProfileRow icon={<RocketIcon size={11} color={brandColor} />} label="Start an Application" />
          <ProfileRow icon={<StatusIcon size={11} color={brandColor} />} label="Check the Status" />
          <ProfileRow icon={<CreditCardIcon size={14} color={brandColor} />} label="Manage Subscriptions" last />
        </ProfileSection>
        <ProfileSection title="LEAVE A COMMENT"><ProfileRow icon={<ChatIcon size={12} color={brandColor} />} label="Send Feedback" last /></ProfileSection>
        <ProfileSection title="ADMIN"><ProfileRow icon={<AdminIcon size={12} color={brandColor} />} label="Admin Portal" last /></ProfileSection>
        <div style={{ height: 110 }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS — all values native Figma px
   ══════════════════════════════════════════════════════════════════ */
const SF = "'SF Pro', -apple-system, system-ui, sans-serif";

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 22px 0" }}>
      <p className="uppercase" style={{ fontFamily: SF, fontWeight: 700, fontSize: 10, letterSpacing: 1.8, color: "rgba(10,38,30,0.6)", margin: "0 0 8px" }}>{title}</p>
      {children}
    </div>
  );
}

function ProfileRow({ icon, label, last, dashed }: { icon: React.ReactNode; label: string; last?: boolean; dashed?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{
      padding: "10px 6px",
      borderBottom: last ? "none" : "0.5px solid rgba(10,38,30,0.06)",
      ...(dashed ? { border: "0.5px dashed rgba(10,38,30,0.1)", borderRadius: 14, padding: "14px 16px", marginBottom: 3 } : {}),
    }}>
      <div className="flex items-center gap-[12px]">
        <div style={{ width: 18, display: "flex", justifyContent: "center" }}>{icon}</div>
        <span style={{ fontFamily: SF, fontWeight: 510, fontSize: 11, lineHeight: "18px", color: "inherit" }}>{label}</span>
      </div>
      <ChevronRight color="rgba(10,38,30,0.2)" size={8} />
    </div>
  );
}

function DonateBanner({ brandColor, accent, appName, filledButton }: { brandColor: string; accent: string; appName: string; filledButton?: boolean }) {
  return (
    <div className="flex items-center justify-between relative" style={{
      background: brandColor, borderRadius: 50, margin: "14px 20px 0",
      padding: "14px 18px", height: 64,
      boxShadow: "inset 0px 4px 4px rgba(0,0,0,0.25)",
    }}>
      <div className="flex items-center" style={{ gap: 12 }}>
        <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 28, background: hexToRgba(accent, 0.2) }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 20, color: accent, lineHeight: "24px", textAlign: "center", width: 36 }}>♥</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <p style={{ fontFamily: SF, fontWeight: 700, fontSize: 14, lineHeight: "17px", color: "#F0EDE6", margin: 0 }}>Support {appName}</p>
          <p style={{ fontFamily: SF, fontWeight: 500, fontSize: 10, lineHeight: "12px", color: "rgba(240,237,230,0.55)", margin: 0 }}>Donate</p>
        </div>
      </div>
      <div className="rounded-full shrink-0 flex items-center" style={{
        padding: "7px 14px",
        background: filledButton ? accent : "transparent",
        borderRadius: 100,
      }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 11, lineHeight: "13px", color: filledButton ? brandColor : accent }}>DONATE →</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, right, accent, divider, calendarIcon }: {
  title: string; right?: string; accent?: string; divider?: boolean; calendarIcon?: boolean;
}) {
  return (
    <div style={{ padding: "20px 20px 10px" }}>
      <div className="flex items-center justify-between" style={{ paddingBottom: 6 }}>
        <span className="uppercase" style={{ fontFamily: SF, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: "inherit" }}>{title}</span>
        {right && (
          <span className="flex items-center gap-[4px] uppercase" style={{ fontFamily: SF, fontWeight: 400, fontSize: 10, lineHeight: "12px", color: accent || "rgba(10,38,30,0.6)" }}>
            {calendarIcon && <CalendarIcon size={12} color="rgba(10,38,30,0.5)" />}
            {right}
          </span>
        )}
      </div>
      {divider && <div style={{ height: 1, background: "currentColor", opacity: 0.08 }} />}
    </div>
  );
}

function ProgramsList({ brandColor, accent }: { brandColor: string; accent: string }) {
  const programs = [
    { name: "MAS SI Soccer Program", date: "April 10 · 6pm", tag: "Sports & Youth", hue: 35 },
    { name: "Quranic Wisdoms", date: "April 11 · 6pm", tag: "Quran Study", hue: 140 },
    { name: "Soulful Saturdays", date: "April 30 · 6pm", tag: "Kids", hue: 25 },
  ];
  return (
    <div style={{ padding: "0 22px" }}>
      {programs.map((prog, i) => (
        <div key={i} className="flex items-center" style={{
          height: 80, gap: 12,
          borderBottom: i < 2 ? "0.5px solid rgba(10,38,30,0.1)" : "none",
        }}>
          <div className="rounded-[10px] shrink-0 overflow-hidden" style={{
            width: 50, height: 50,
            background: `linear-gradient(135deg, hsl(${prog.hue},30%,70%) 0%, hsl(${prog.hue},25%,55%) 100%)`,
          }} />
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: SF, fontWeight: 590, fontSize: 10, lineHeight: "14px", color: brandColor, margin: 0 }}>{prog.name}</p>
            <p style={{ fontFamily: SF, fontWeight: 400, fontSize: 10, lineHeight: "14px", color: "rgba(10,38,30,0.6)", margin: "1px 0 0" }}>{prog.date}</p>
            <p style={{ fontFamily: SF, fontWeight: 400, fontSize: 10, lineHeight: "18px", color: accent, margin: "1px 0 0" }}>{prog.tag}</p>
          </div>
          <ChevronRight color="rgba(10,38,30,0.6)" size={8} />
        </div>
      ))}
    </div>
  );
}

function RecommendedCards({ brandColor, tall }: { brandColor: string; tall?: boolean }) {
  const h = tall ? 196 : 160;
  return (
    <div className="flex gap-[15px]" style={{ padding: "8px 20px", overflow: "hidden" }}>
      <div className="flex-1 min-w-0">
        <div className="rounded-[14px] overflow-hidden relative" style={{ width: "100%", height: h, background: "linear-gradient(160deg, #0B1A2E 0%, #1A2F4A 40%, #0D1B2A 100%)" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
            {[{ x: 15, y: 10, s: 2 }, { x: 45, y: 6, s: 1.5 }, { x: 72, y: 15, s: 1.8 }, { x: 28, y: 28, s: 1.2 }, { x: 60, y: 22, s: 1.5 }, { x: 85, y: 32, s: 1.8 }].map((s, i) => (
              <div key={i} className="rounded-full absolute" style={{ width: s.s, height: s.s, background: "#FFF", left: `${s.x}%`, top: `${s.y}%` }} />
            ))}
          </div>
          <div className="rounded-full absolute" style={{ width: 40, height: 40, right: 28, top: 16, background: "radial-gradient(circle, rgba(255,240,200,0.3) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 18, width: 50, height: "55%", background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%)", borderRadius: "50% 50% 0 0" }} />
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", margin: 0, letterSpacing: 0.5, direction: "rtl" }}>فِرُّوا إِلَى اللَّه</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: "white", margin: "3px 0 0", letterSpacing: 0.5 }}>SO FLEE TO ALLAH</p>
          </div>
        </div>
        <p style={{ fontFamily: SF, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: brandColor, margin: "6px 0 0" }}>Advanced Tajweed & Reading</p>
        <p style={{ fontFamily: SF, fontWeight: 400, fontSize: 13, lineHeight: "16px", color: "rgba(10,38,30,0.6)", margin: "1px 0 0" }}>Quran Study</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-[14px] overflow-hidden relative" style={{ width: "100%", height: h, background: "linear-gradient(135deg, #2A4A3A 0%, #3D6B4D 40%, #1A3A2A 100%)" }}>
          <div className="absolute rounded-[5px]" style={{ width: 32, height: 38, right: 16, top: 14, background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
            <div style={{ background: "#C0392B", height: 8, borderRadius: "5px 5px 0 0" }} />
            <div className="flex items-center justify-center" style={{ height: 30 }}><span style={{ fontSize: 16, fontWeight: 800, color: "#1A3A2A" }}>7</span></div>
          </div>
          <div style={{ position: "absolute", top: 16, left: 14 }}>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", margin: 0, textTransform: "uppercase", letterSpacing: 0.4 }}>Suhoor will be</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: "3px 0 0", lineHeight: 1.1 }}>SATURDAY</p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>MARCH</p>
          </div>
          <div style={{ position: "absolute", bottom: 14, left: 14 }}><p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.8)", margin: 0 }}>FOR ALL AGES</p></div>
        </div>
        <p style={{ fontFamily: SF, fontWeight: 590, fontSize: 13, lineHeight: "16px", color: brandColor, margin: "6px 0 0" }}>Young Brother Qiyam</p>
        <p style={{ fontFamily: SF, fontWeight: 400, fontSize: 13, lineHeight: "16px", color: "rgba(10,38,30,0.6)", margin: "1px 0 0" }}>Spirituality & Tazkiyah</p>
      </div>
    </div>
  );
}

function CircleButton({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-center justify-center rounded-full" style={{
      width: 26, height: 26,
      border: dark ? "0.5px solid rgba(255,255,255,0.15)" : `0.5px solid #0A261E`,
      background: dark ? "rgba(255,255,255,0.08)" : "transparent",
    }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY ART
   ═══════════════════════════════════════════════════════════════ */
function CrescentArt() {
  return <svg width="70" height="70" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="14" stroke="#C4A35A" strokeWidth="0.8" fill="none" opacity="0.3" /><path d="M26 8 C22 12, 22 28, 26 32" stroke="#C4A35A" strokeWidth="0.8" fill="none" opacity="0.4" /><circle cx="20" cy="18" r="7" stroke="#C4A35A" strokeWidth="0.6" fill="rgba(196,163,90,0.08)" /><circle cx="10" cy="10" r="1" fill="#C4A35A" opacity="0.4" /><circle cx="32" cy="14" r="0.8" fill="#C4A35A" opacity="0.3" /></svg>;
}
function BookArt() {
  return <svg width="65" height="65" viewBox="0 0 36 36" fill="none"><path d="M8 28 L8 10 Q8 8 10 8 L18 8 L18 28 Q14 26 10 28 Z" fill="rgba(196,163,90,0.2)" stroke="rgba(196,163,90,0.4)" strokeWidth="0.5" /><path d="M28 28 L28 10 Q28 8 26 8 L18 8 L18 28 Q22 26 26 28 Z" fill="rgba(196,163,90,0.15)" stroke="rgba(196,163,90,0.4)" strokeWidth="0.5" /><line x1="11" y1="13" x2="16" y2="13" stroke="rgba(196,163,90,0.3)" strokeWidth="0.4" /><line x1="11" y1="16" x2="15" y2="16" stroke="rgba(196,163,90,0.2)" strokeWidth="0.4" /><path d="M22 6 Q26 10 24 18 Q23 14 20 12 Q24 12 22 6Z" fill="rgba(196,163,90,0.25)" /></svg>;
}
function WheatArt() {
  return <svg width="65" height="65" viewBox="0 0 36 36" fill="none"><line x1="18" y1="32" x2="18" y2="6" stroke="rgba(196,163,90,0.4)" strokeWidth="0.6" />{[6,10,14,18,22].map((y,i) => <g key={i}><ellipse cx={15} cy={y+2} rx="3" ry="1.5" fill="rgba(196,163,90,0.2)" transform={`rotate(-20 15 ${y+2})`} /><ellipse cx={21} cy={y+2} rx="3" ry="1.5" fill="rgba(196,163,90,0.2)" transform={`rotate(20 21 ${y+2})`} /></g>)}<path d="M16 6 L18 2 L20 6" stroke="rgba(196,163,90,0.3)" strokeWidth="0.5" fill="none" /></svg>;
}

/* ═══════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════ */
function DonateIcon({ color = "#0A261E" }: { color?: string }) { return <svg width="27" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /><path d="M12 8v8M8 12h8" /></svg>; }
function VolunteerIcon({ color = "#0A261E" }: { color?: string }) { return <svg width="29" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>; }
function AdvertiseIcon({ color = "#0A261E" }: { color?: string }) { return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>; }
function PrayersIcon({ color = "#0A261E" }: { color?: string }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>; }

function PrayerIcon({ type, size, color }: { type: string; size: number; color: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "sunrise": return <svg {...p}><path d="M17 18a5 5 0 00-10 0" /><line x1="12" y1="9" x2="12" y2="2" /><line x1="4.22" y1="10.22" x2="5.64" y2="11.64" /><line x1="1" y1="18" x2="3" y2="18" /><line x1="21" y1="18" x2="23" y2="18" /><line x1="18.36" y1="11.64" x2="19.78" y2="10.22" /><polyline points="8 6 12 2 16 6" /></svg>;
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
    case "moon": return <svg {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>;
    case "crescent": return <svg {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /><circle cx="8" cy="8" r="1" fill={color} stroke="none" /></svg>;
    default: return null;
  }
}

function TabIcon({ name, color, size = 19, active }: { name: string; color: string; size?: number; active?: boolean }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, opacity: active ? 1 : 0.5 };
  switch (name) {
    case "Home": return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill={active ? color : "none"} /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case "Discover": return <svg {...p}><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} /></svg>;
    case "Watch": return <svg {...p}><polygon points="5 3 19 12 5 21 5 3" fill={active ? color : "none"} /></svg>;
    case "Prayer": return <svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case "Profile": return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    default: return null;
  }
}

function BellDotIcon({ size, color, filled }: { size: number; color: string; filled?: boolean }) {
  /* Real app: outline bell normally, filled gold bell on active row */
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth={filled ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function ChevronLeft({ color, size = 14 }: { color: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function ChevronRight({ color, size = 8 }: { color: string; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>; }
function SearchIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function PinIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>; }
function ShareIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>; }
function LinkIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>; }
function MessageIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>; }
function SettingsIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>; }
function PersonAddIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>; }
function BookmarkIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>; }
function PlaylistIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>; }
function InvoiceIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>; }
function CreditCardIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>; }
function BellIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>; }
function CalendarCheckIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M9 16l2 2 4-4" /></svg>; }
function CalendarIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function ShoppingBagIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>; }
function RocketIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /></svg>; }
function StatusIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function ChatIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /><circle cx="9" cy="10" r="1" fill={color} /><circle cx="15" cy="10" r="1" fill={color} /></svg>; }
function AdminIcon({ size, color }: { size: number; color: string }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
