import { ImageResponse } from "next/og";

export const alt =
  "Reta Fútbol · Manager estilo FIFA para organizar tu reta: jugadores, equipos balanceados y marcador en vivo";
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
          padding: 80,
          color: "white",
          background:
            "linear-gradient(135deg,#0b3d2e 0%,#0a3327 60%,#072018 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* halfway line + center circle, faint */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 480,
            display: "flex",
            opacity: 0.12,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: "white",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -150,
              top: 165,
              width: 300,
              height: 300,
              borderRadius: 300,
              border: "3px solid white",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 14,
              background: "#6ee7b7",
            }}
          />
          <span
            style={{
              fontSize: 24,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#6ee7b7",
              fontWeight: 600,
            }}
          >
            Temporada 2026
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 150,
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: -2,
              textTransform: "uppercase",
            }}
          >
            La Reta
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 34,
              lineHeight: 1.3,
              color: "rgba(236,253,245,0.82)",
              maxWidth: 760,
            }}
          >
            Manager estilo FIFA para tu reta: crea jugadores, arma equipos
            parejos y lleva el marcador en vivo.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {["Jugadores + stats", "Equipos balanceados", "Marcador en vivo"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 600,
                  padding: "12px 22px",
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
    ),
    { ...size },
  );
}
