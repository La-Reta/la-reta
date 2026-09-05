import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Rect,
  Stop,
} from "react-native-svg";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Display, Palette, Radius, Shadow, Spacing } from "@/constants/theme";
import { nextReta } from "@/lib/reta-date";

/**
 * Cuándo es la próxima reta, arriba del todo.
 *
 * Es el único bloque en verde macizo de la app y está ahí por una razón: es el
 * dato que caduca. El resto —plantilla, historial, atributos— sigue siendo
 * cierto mañana; esto no, y por eso se lleva el acento entero.
 *
 * El fondo no es un rectángulo plano: lleva degradado y, saliéndose por la
 * derecha, el círculo central de una cancha —el mismo motivo de la marca—. Da
 * profundidad sin meter una imagen y sin robarle contraste al texto, que se
 * queda en la mitad izquierda.
 *
 * No lleva acciones: el calendario vivía aquí en una esquina, como un icono
 * suelto sin nombre, y se fue a la fila de accesos de abajo, donde tiene
 * etiqueta y sitio propio.
 *
 * El `<Svg>` lleva `width`/`height` al 100 % además de `absoluteFill`: en web
 * no hereda el tamaño del contenedor y el degradado se quedaba en una esquina.
 *
 * La cifra grande sí lleva `lineHeight` explícito (~1.2 em). Sin él, RN no
 * reserva la caja que Oswald necesita a este tamaño y el número sale cortado
 * por arriba, con medio glifo visible. No hay techo: 72 pt con interlineado de
 * 86 se dibuja entero y en Oswald.
 */

const HEIGHT = 188;

export function MatchdayBanner() {
  // Se calcula una vez por montaje: el conteo va en días, así que recalcularlo
  // en cada render no cambiaría el número y solo gastaría trabajo.
  const reta = useMemo(() => nextReta(), []);
  const today = reta.daysUntil === 0;

  return (
    <View
      style={{
        height: HEIGHT,
        borderRadius: Radius.xl,
        borderCurve: "continuous",
        overflow: "hidden",
        boxShadow: Shadow.accent,
      }}
    >
      <Svg height="100%" style={StyleSheet.absoluteFill} width="100%">
        <Defs>
          <LinearGradient id="matchday" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#0E9068" />
            <Stop offset="0.55" stopColor="#007A55" />
            <Stop offset="1" stopColor="#02543C" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#matchday)" height="100%" width="100%" />

        {/* Medio campo asomando por la derecha. */}
        <Circle
          cx="92%"
          cy="50%"
          fill="none"
          r={92}
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth={2}
        />
        <Circle cx="92%" cy="50%" fill="rgba(255, 255, 255, 0.07)" r={44} />
        <Line
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth={2}
          x1="92%"
          x2="92%"
          y1="0"
          y2="100%"
        />
      </Svg>

      <View
        style={{
          flex: 1,
          padding: Spacing.four,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.two,
          }}
        >
          <Icon
            color={Palette.accentInk}
            name="ball"
            size={16}
            strokeWidth={2}
          />
          <Text style={{ opacity: 0.9 }} tone="onAccent" variant="eyebrow">
            {today ? "Hoy se juega" : "Próxima reta"}
          </Text>
        </View>

        <View style={{ gap: Spacing.one }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: Spacing.two,
            }}
          >
            <Text
              style={{
                color: Palette.accentInk,
                fontFamily: Display.bold,
                fontSize: today ? 56 : 72,
                lineHeight: today ? 68 : 86,
                letterSpacing: 1,
              }}
            >
              {today ? "HOY" : reta.daysUntil}
            </Text>
            {today ? null : (
              <Text
                style={{
                  color: Palette.accentInk,
                  fontFamily: Display.bold,
                  fontSize: 26,
                  lineHeight: 32,
                  letterSpacing: 1.5,
                  opacity: 0.9,
                  paddingBottom: Spacing.two,
                }}
              >
                {reta.daysUntil === 1 ? "DÍA" : "DÍAS"}
              </Text>
            )}
          </View>

          <Text style={{ opacity: 0.9 }} tone="onAccent" variant="caption">
            {reta.label} · 7:00 pm
          </Text>
        </View>
      </View>
    </View>
  );
}
