import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

import { MatchHero } from "@/components/match-hero";
import { Notice } from "@/components/notice";
import { ScorerBoard } from "@/components/scorer-board";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { VoteResults } from "@/components/vote-results";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useMatchVotes } from "@/hooks/use-match-votes";
import { useReta } from "@/hooks/use-reta";

/**
 * Ficha de un partido.
 *
 * Sale casi entera del listado que ya está descargado —marcador, goleadores,
 * balance, notas—; lo único que pide aparte es la votación, que el listado no
 * trae y que no tendría sentido descargar para los cinco partidos a la vez.
 *
 * Como la ficha de jugador, la montan dos rutas —una por pestaña— para que
 * abrirla desde Inicio no salte a Partidos.
 */
export function MatchSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches, players, loading, error, refetch } = useReta();
  const { tally } = useMatchVotes(id);

  const match = matches?.find((item) => String(item.id) === id) ?? null;

  if (match === null) {
    return (
      <ScrollView
        contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Stack.Screen options={{ title: "Partido" }} />
        {error === null ? (
          <Text tone="faint" variant="caption">
            {loading ? "Cargando el partido…" : "No encontramos este partido."}
          </Text>
        ) : (
          <Notice
            actionLabel="Reintentar"
            detail={error}
            onAction={refetch}
            title="No pudimos leer el partido"
          />
        )}
      </ScrollView>
    );
  }

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
      {/* El título dice qué es la pantalla; la fecha ya está en el contenido y
          repetirla arriba no orienta a nadie. */}
      <Stack.Screen options={{ title: "Partido" }} />

      <MatchHero match={match} />

      <Section title="Goleadores">
        <ScorerBoard match={match} players={players} />
      </Section>

      {tally === null || tally.length === 0 ? null : (
        <Section title="Lo más votado">
          <VoteResults players={players} tally={tally} />
        </Section>
      )}

      {match.notes ? (
        <Section title="Notas">
          <Text selectable tone="muted" variant="body">
            “{match.notes}”
          </Text>
        </Section>
      ) : null}
    </ScrollView>
  );
}
