import { View } from "react-native";
import { Bar, CartesianChart } from "victory-native";

import { Text } from "@/components/ui/text";
import { Motion, Palette } from "@/constants/theme";
import { useChartFont } from "@/hooks/use-chart-font";
import { goalsByMatchday } from "@/lib/series";
import type { Match } from "@/lib/types";

/** Skia parsea color CSS pero no la palabra `transparent`. */
const TRANSPARENT = "rgba(0, 0, 0, 0)";

const CHART_HEIGHT = 168;
/** Con una sola jornada no hay nada que comparar: eso es una cifra, no una serie. */
const MIN_MATCHDAYS = 2;
/** Las jornadas pasadas son fondo: se leen, pero no compiten con la última. */
const PAST_OPACITY = 0.4;

/**
 * Cuántos goles cayeron en cada jornada.
 *
 * Es la única gráfica temporal que la portada necesita: la tira de cifras ya
 * dice cuántos goles lleva la reta en total, pero no si las últimas retas
 * fueron festivales o candados, que es lo que se comenta el jueves.
 *
 * Barras y no línea a propósito. Una reta es un evento suelto cada quince
 * días; una línea uniría dos jornadas separadas por semanas y dibujaría una
 * continuidad que no existe. La barra dice "esto pasó ese día" y nada más.
 *
 * La última jornada va en verde pleno y las anteriores rebajadas. No es un
 * segundo color —es la misma tinta con otro peso— y es lo que convierte una
 * fila de barras iguales en una respuesta: si lo de anoche fue mucho o poco se
 * ve sin leer una sola cifra. Sin leyenda, porque la posición ya lo dice: la
 * llena es la de la derecha, la de la fecha más reciente.
 */
export function GoalsTrend({ matches }: { matches: Match[] | null }) {
  const data = goalsByMatchday(matches);
  const font = useChartFont(11);

  if (data.length < MIN_MATCHDAYS) {
    return (
      <Text tone="faint" variant="caption">
        Hacen falta al menos dos retas jugadas para ver la racha.
      </Text>
    );
  }

  return (
    <View style={{ height: CHART_HEIGHT }}>
      <CartesianChart
        data={data}
        // El hueco lateral no es estético: la etiqueta va centrada bajo su
        // barra, y con la primera pegada al eje "25 jun" se salía del lienzo.
        domainPadding={{ left: 34, right: 34, top: 18 }}
        xAxis={{
          font,
          labelColor: Palette.inkFaint,
          // El eje de fechas no lleva raya: las barras ya se apoyan en ella.
          lineColor: TRANSPARENT,
          tickCount: data.length,
        }}
        xKey="label"
        yAxis={[
          {
            font,
            labelColor: Palette.inkFaint,
            lineColor: Palette.line,
            tickCount: 3,
            formatYLabel: (value) => String(Math.round(Number(value))),
          },
        ]}
        yKeys={["goals", "latest"]}
      >
        {({ points, chartBounds }) => (
          <>
            <Bar
              animate={{ type: "timing", duration: Motion.slow }}
              chartBounds={chartBounds}
              color={Palette.accent}
              opacity={PAST_OPACITY}
              points={points.goals}
              roundedCorners={{ topLeft: 6, topRight: 6 }}
            />
            <Bar
              animate={{ type: "timing", duration: Motion.slow }}
              chartBounds={chartBounds}
              color={Palette.accent}
              points={points.latest}
              roundedCorners={{ topLeft: 6, topRight: 6 }}
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
