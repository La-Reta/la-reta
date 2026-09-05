import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { PlayerAvatar } from "@/components/player-avatar";
import { Text } from "@/components/ui/text";
import { Radius, Shadow, Spacing } from "@/constants/theme";
import type { LineupSlot } from "@/lib/lineup";

/**
 * La cancha con el once encima, a lo alto.
 *
 * El césped va en SVG —líneas reales a escala, con sus áreas y su círculo
 * central— y las caras van en vistas normales posicionadas por encima en
 * porcentajes. Mezclar los dos es lo que permite reutilizar `PlayerAvatar` con
 * sus fotos y su color de nivel, en vez de reimplementar el retrato dentro del
 * SVG.
 *
 * Es la pieza que la pantalla de armar equipos reutilizará: mismos huecos,
 * distinta fuente de jugadores.
 */

// Proporción de una cancha real (68 × 105 m) puesta en vertical.
const W = 680;
const H = 1050;
const LINE = "rgba(255, 255, 255, 0.55)";
const STRIPES = 8;

export function PitchLineup({ slots }: { slots: LineupSlot[] }) {
  return (
    <View
      style={{
        width: "100%",
        aspectRatio: W / H,
        borderRadius: Radius.xl,
        borderCurve: "continuous",
        overflow: "hidden",
        boxShadow: Shadow.card,
      }}
    >
      <Svg height="100%" viewBox={`0 0 ${W} ${H}`} width="100%">
        <Defs>
          <LinearGradient id="grass" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#0B7A5E" />
            <Stop offset="1" stopColor="#04503C" />
          </LinearGradient>
        </Defs>

        <Rect fill="url(#grass)" height={H} width={W} />

        {/* Franjas de corte: dan profundidad sin dibujar una textura. */}
        {Array.from({ length: STRIPES }, (_, i) =>
          i % 2 === 0 ? (
            <Rect
              fill="rgba(255, 255, 255, 0.045)"
              height={H / STRIPES}
              key={i}
              width={W}
              x={0}
              y={(i * H) / STRIPES}
            />
          ) : null
        )}

        <Rect
          fill="none"
          height={H - 40}
          stroke={LINE}
          strokeWidth={3}
          width={W - 40}
          x={20}
          y={20}
        />
        <Line
          stroke={LINE}
          strokeWidth={3}
          x1={20}
          x2={W - 20}
          y1={H / 2}
          y2={H / 2}
        />
        <Circle
          cx={W / 2}
          cy={H / 2}
          fill="none"
          r={91.5}
          stroke={LINE}
          strokeWidth={3}
        />
        <Circle cx={W / 2} cy={H / 2} fill={LINE} r={5} />

        {/* Áreas grandes (16.5 × 40.32 m) y pequeñas (5.5 × 18.32 m). */}
        <Rect
          fill="none"
          height={165}
          stroke={LINE}
          strokeWidth={3}
          width={403}
          x={W / 2 - 201}
          y={20}
        />
        <Rect
          fill="none"
          height={165}
          stroke={LINE}
          strokeWidth={3}
          width={403}
          x={W / 2 - 201}
          y={H - 185}
        />
        <Rect
          fill="none"
          height={55}
          stroke={LINE}
          strokeWidth={3}
          width={183}
          x={W / 2 - 91}
          y={20}
        />
        <Rect
          fill="none"
          height={55}
          stroke={LINE}
          strokeWidth={3}
          width={183}
          x={W / 2 - 91}
          y={H - 75}
        />

        {/* Semicírculos de penalti, solo el trozo que asoma del área. */}
        <Path
          d={`M ${W / 2 - 73} 185 A 91.5 91.5 0 0 0 ${W / 2 + 73} 185`}
          fill="none"
          stroke={LINE}
          strokeWidth={3}
        />
        <Path
          d={`M ${W / 2 - 73} ${H - 185} A 91.5 91.5 0 0 1 ${W / 2 + 73} ${H - 185}`}
          fill="none"
          stroke={LINE}
          strokeWidth={3}
        />
      </Svg>

      {slots.map((slot) => (
        <View
          key={slot.id}
          style={{
            position: "absolute",
            left: `${slot.left}%`,
            top: `${slot.top}%`,
            // Las coordenadas marcan el centro del jugador, no su esquina.
            transform: [{ translateX: -26 }, { translateY: -26 }],
            alignItems: "center",
            width: 52,
            gap: Spacing.half,
          }}
        >
          {slot.player ? (
            <PlayerAvatar player={slot.player} size={40} />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "rgba(255, 255, 255, 0.5)",
              }}
            />
          )}

          <Text
            numberOfLines={1}
            style={{
              color: "#FFFFFF",
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 0.3,
              textShadowColor: "rgba(0, 0, 0, 0.6)",
              textShadowRadius: 3,
            }}
          >
            {slot.player?.displayName ?? slot.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
