import { ImageResponse } from "next/og";

export const alt =
  "Sahla — Fully branded iOS and Android apps for mosques.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(ellipse at 75% 30%, rgba(74,140,101,0.28) 0%, transparent 55%), linear-gradient(180deg, #0E2B22 0%, #071A14 100%)",
          color: "#fffbf2",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {/* Top — eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              transform: "rotate(45deg)",
              background: "#d4af37",
              boxShadow: "0 0 24px rgba(212,175,55,0.6)",
            }}
          />
          <span
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#d9c4a0",
            }}
          >
            Sahla
          </span>
        </div>

        {/* Middle — headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div
            style={{
              fontSize: "88px",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              color: "#fffbf2",
              maxWidth: "960px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Your mosque deserves</span>
            <span>
              its <em style={{ color: "#d9c4a0", fontStyle: "italic" }}>own</em> app.
            </span>
          </div>
          <div
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "26px",
              lineHeight: 1.5,
              color: "rgba(255,251,242,0.55)",
              maxWidth: "780px",
            }}
          >
            Fully branded iOS and Android apps for mosques. Your name in the
            App Store, your colors, your community.
          </div>
        </div>

        {/* Bottom — divider + url */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                height: "1px",
                width: "120px",
                background:
                  "linear-gradient(90deg, transparent, rgba(217,196,160,0.7))",
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                transform: "rotate(45deg)",
                background: "#d4af37",
              }}
            />
            <div
              style={{
                height: "1px",
                width: "120px",
                background:
                  "linear-gradient(90deg, rgba(217,196,160,0.7), transparent)",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "rgba(255,251,242,0.7)",
            }}
          >
            sahla.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
