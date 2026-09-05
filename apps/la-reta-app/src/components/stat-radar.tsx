import { View } from "react-native";
import Svg, { Circle, Line, Polygon } from "react-native-svg";

import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";
import { STAT_ABBR, STAT_KEYS, type Player, type StatKey } from "@/lib/types";

/**
 * Hexágono de atributos, el mismo que enseña cualquier ficha de fútbol.
 *
 * Dice de un vistazo algo que seis barras no dicen: la *forma* del jugador. Un
 * extremo veloz y flojo atrás se reconoce por la silueta antes de leer un solo
 * número, y dos jugadores se comparan superponiendo mentalmente sus polígonos.
 *
 * Los ejes van en el orden de FIFA (ritmo arriba, girando en el sentido del
 * reloj) para que esa silueta sea comparable con la de cualquier otra app.
 *
 * `compare` dibuja detrás un polígono de referencia —la media de la plantilla—
 * porque un número suelto no dice nada: 68 de ritmo es mucho o poco según con
 * quién juegue. Con las dos siluetas superpuestas, dónde saca ventaja y dónde
 * la cede se ve sin leer una cifra.
 */

const AXES: StatKey[] = [
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physical",
];
/** El máximo de la escala. Los atributos van de 1 a 99. */
const MAX = 100;
const RINGS = [0.25, 0.5, 0.75, 1];

export function StatRadar({
  player,
  compare,
  size = 284,
}: {
  player: Player;
  /** Valores de referencia por atributo; se dibujan como silueta de fondo. */
  compare?: Record<StatKey, number> | null;
  size?: number;
}) {
  const center = size / 2;
  // El polígono ocupa el 62 % del radio y las etiquetas se colocan a 1.3 de
  // ese radio: justo dentro del cuadro, sin recortarse en los vértices.
  const radius = center * 0.62;

  const pointAt = (index: number, ratio: number) => {
    const angle = ((-90 + index * (360 / AXES.length)) * Math.PI) / 180;
    return {
      x: center + Math.cos(angle) * radius * ratio,
      y: center + Math.sin(angle) * radius * ratio,
    };
  };

  const polygon = (ratio: number) =>
    AXES.map((_, index) => {
      const { x, y } = pointAt(index, ratio);
      return `${x},${y}`;
    }).join(" ");

  const valuePoints = AXES.map((key, index) => {
    const { x, y } = pointAt(index, player[key] / MAX);
    return `${x},${y}`;
  }).join(" ");

  const comparePoints = compare
    ? AXES.map((key, index) => {
        const { x, y } = pointAt(index, compare[key] / MAX);
        return `${x},${y}`;
      }).join(" ")
    : null;

  return (
    <View style={{ width: size, height: size }}>
      <Svg height={size} width={size}>
        {RINGS.map((ring) => (
          <Polygon
            fill="none"
            key={ring}
            points={polygon(ring)}
            stroke={Palette.line}
            strokeWidth={1}
          />
        ))}

        {AXES.map((key, index) => {
          const { x, y } = pointAt(index, 1);
          return (
            <Line
              key={key}
              stroke={Palette.line}
              strokeWidth={1}
              x1={center}
              x2={x}
              y1={center}
              y2={y}
            />
          );
        })}

        {comparePoints === null ? null : (
          <Polygon
            fill="none"
            points={comparePoints}
            stroke={Palette.inkFaint}
            strokeDasharray="4 4"
            strokeLinejoin="round"
            strokeWidth={1.5}
          />
        )}

        <Polygon
          fill={Palette.accent}
          fillOpacity={0.18}
          points={valuePoints}
          stroke={Palette.accent}
          strokeLinejoin="round"
          strokeWidth={2}
        />

        {AXES.map((key, index) => {
          const { x, y } = pointAt(index, player[key] / MAX);
          return (
            <Circle
              cx={x}
              cy={y}
              fill={Palette.accent}
              key={key}
              r={3.5}
              stroke={Palette.surface}
              strokeWidth={1.5}
            />
          );
        })}
      </Svg>

      {/*
        Las etiquetas van en vistas y no en <Text> de SVG: así heredan la
        tipografía y las cifras tabulares del resto de la app, que dentro del
        SVG habría que reconfigurar a mano.
      */}
      {AXES.map((key, index) => {
        const { x, y } = pointAt(index, 1.3);
        return (
          <View
            key={key}
            style={{
              position: "absolute",
              left: x - 26,
              top: y - 16,
              width: 52,
              alignItems: "center",
            }}
          >
            <Text variant="statSmall">{player[key]}</Text>
            <Text tone="faint" variant="eyebrow">
              {STAT_ABBR[key]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Comprobación: el hexágono usa los mismos seis atributos que la carta. */
export const RADAR_COVERS_ALL_STATS =
  AXES.length === STAT_KEYS.length &&
  STAT_KEYS.every((key) => AXES.includes(key));
