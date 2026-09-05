import * as WebBrowser from "expo-web-browser";
import { useCallback, useMemo } from "react";
import { ScrollView, View } from "react-native";

import { PitchLineup } from "@/components/pitch-lineup";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";
import { API_URL } from "@/lib/api";
import { bestEleven } from "@/lib/lineup";

/**
 * Armar la reta.
 *
 * El balanceador vive hoy en la web y mover ese algoritmo al móvil es un
 * trabajo aparte, así que esta pantalla hace tres cosas honestas: dice cuánta
 * plantilla hay para repartir, enseña el once ideal sobre la cancha —el mismo
 * 4-3-3 que la web— y abre el armador real en el navegador, en vez de fingir un
 * botón que no arma nada.
 */

const STEPS = [
  {
    title: "Convoca",
    detail: "Marca quién va a la reta de hoy. Con ocho ya se puede repartir.",
  },
  {
    title: "Reparte",
    detail:
      "Se arman los equipos igualando overall y cubriendo cada posición, no por orden de llegada.",
  },
  {
    title: "Juega y registra",
    detail:
      "El marcador en vivo guarda goles y asistencias, y el partido entra al historial.",
  },
];

export default function RetaScreen() {
  const { players, summary } = useReta();

  // El mismo 4-3-3 que la web. Cuando exista el armador nativo, esta cancha
  // pasa a dibujar los equipos generados en vez del once ideal: los huecos y el
  // componente son los mismos.
  const eleven = useMemo(() => bestEleven(players ?? []), [players]);

  const openBuilder = useCallback(() => {
    WebBrowser.openBrowserAsync(`${API_URL}/teams`);
  }, []);

  const squadLabel = players === null ? "—" : summary.squad;

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.five,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
        <Text tone="accent" variant="eyebrow">
          Disponibles
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: Spacing.two,
          }}
        >
          <Text variant="stat">{squadLabel}</Text>
          <Text tone="muted" variant="body">
            jugadores en la plantilla
          </Text>
        </View>
        <Text tone="muted" variant="caption">
          Media de {summary.avgOverall || "—"} de overall y{" "}
          {summary.avgAge || "—"} años.
        </Text>
      </Surface>

      {players === null || players.length === 0 ? null : (
        <Section meta="4-3-3" title="Once ideal">
          <PitchLineup slots={eleven} />
        </Section>
      )}

      <Section title="Cómo se arma">
        <View>
          {STEPS.map((step, index) => (
            <View
              key={step.title}
              style={{
                flexDirection: "row",
                gap: Spacing.three,
                paddingVertical: Spacing.three,
                borderBottomWidth: index === STEPS.length - 1 ? 0 : 1,
                borderBottomColor: Palette.hairline,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: Radius.pill,
                  backgroundColor: Palette.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text tone="accent" variant="eyebrow">
                  {index + 1}
                </Text>
              </View>

              <View style={{ flex: 1, gap: Spacing.half }}>
                <Text variant="bodyStrong">{step.title}</Text>
                <Text tone="muted" variant="caption">
                  {step.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Section>

      <View style={{ gap: Spacing.two }}>
        <Button
          label="Armar en la web"
          onPress={openBuilder}
          variant="primary"
        />
        <Text style={{ textAlign: "center" }} tone="faint" variant="caption">
          El armador nativo llega después; por ahora abre el de siempre.
        </Text>
      </View>
    </ScrollView>
  );
}
