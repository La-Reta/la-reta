import { ImageResponse } from "next/og";

export const alt =
  "Reta Fútbol · Manager estilo FIFA para organizar tu reta: jugadores, equipos balanceados y marcador en vivo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CARD_STATS: [string, number][] = [
  ["PAC", 91],
  ["SHO", 88],
  ["PAS", 84],
  ["DRI", 90],
  ["DEF", 42],
  ["PHY", 83],
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          color: "white",
          background:
            "radial-gradient(120% 130% at 100% 0%, rgba(16,185,129,0.18), transparent 45%), linear-gradient(135deg,#0b3d2e 0%,#0a3327 58%,#061a14 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Faint pitch markings from the right touchline */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.1,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 600,
              top: 0,
              bottom: 0,
              width: 3,
              background: "white",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 470,
              top: 155,
              width: 320,
              height: 320,
              borderRadius: 320,
              border: "3px solid white",
            }}
          />
        </div>

        {/* Left: message */}
        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 12,
                background: "#6ee7b7",
              }}
            />
            <span
              style={{
                fontSize: 22,
                letterSpacing: 8,
                textTransform: "uppercase",
                color: "#6ee7b7",
                fontWeight: 700,
              }}
            >
              Temporada 2026
            </span>
          </div>

          <div
            style={{
              fontSize: 148,
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: -3,
              textTransform: "uppercase",
              marginTop: 18,
            }}
          >
            La Reta
          </div>

          <div
            style={{
              marginTop: 22,
              fontSize: 30,
              lineHeight: 1.32,
              color: "rgba(236,253,245,0.82)",
            }}
          >
            Arma equipos parejos, lleva el marcador en vivo y sigue a tus
            cracks. Tu cascarita en modo carrera.
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 34 }}>
            {["Equipos balanceados", "Marcador en vivo", "Goleadores"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    fontSize: 21,
                    fontWeight: 600,
                    padding: "10px 20px",
                    borderRadius: 999,
                    color: "#d1fae5",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(110,231,183,0.35)",
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Right: signature FIFA-style card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 300,
            height: 424,
            padding: 28,
            borderRadius: 28,
            background: "linear-gradient(160deg,#fde68a 0%,#f5b942 55%,#d99a2b 100%)",
            color: "#3a2a08",
            boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 68, fontWeight: 800, lineHeight: 0.9 }}>
                99
              </span>
              <span style={{ fontSize: 26, fontWeight: 800, marginTop: 2 }}>
                ST
              </span>
            </div>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: 90,
                background: "rgba(58,42,8,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
              }}
            >
              ⚽
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
              borderBottom: "2px solid rgba(58,42,8,0.25)",
              paddingBottom: 14,
            }}
          >
            La Reta
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexWrap: "wrap",
              rowGap: 12,
            }}
          >
            {CARD_STATS.map(([label, value]) => (
              <div
                key={label}
                style={{ display: "flex", width: "50%", gap: 10, fontSize: 24 }}
              >
                <span style={{ fontWeight: 800 }}>{value}</span>
                <span style={{ fontWeight: 700, opacity: 0.75 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
