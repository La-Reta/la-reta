import { useEffect, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import {
  SpotlightCard,
  SpotlightCardSkeleton,
} from "@/components/spotlight-card";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import { tiedTopScorers, topScorers, type TiedScorer } from "@/lib/series";
import type { Match, Player } from "@/lib/types";

/** Lo que tarda en pasar sola a la siguiente ficha, igual que en la web. */
const ROTATE_MS = 4500;
/** Alto de la línea de partidos, para que el esqueleto reserve su sitio. */
const NOTE_HEIGHT = 18;

const DOT_SIZE = 6;
const DOT_ACTIVE_WIDTH = 16;
/** Objetivo táctil alrededor del punto: 6 pt no se aciertan con el pulgar. */
const DOT_HIT = 22;

/**
 * "El goleador": quien más ha marcado, y **todos** los que empatan con él.
 *
 * El empate arriba no es un caso raro en una reta de veinte, y coronar a uno
 * solo obligaba a inventar un desempate. Así que cuando hay empate esto no
 * elige: los enseña a todos, uno por página, y quien mira decide a quién abre.
 *
 * **Se desliza con el dedo y además pasa sola.** La web solo rota porque ahí no
 * hay nada que deslizar; en el teléfono el gesto es la forma natural de pasar
 * páginas, y la rotación automática está para que se note que hay más de uno
 * sin tener que descubrirlo. En cuanto alguien arrastra, el turno automático se
 * apaga para siempre: ya tomó el control, y una tarjeta que se mueve sola
 * mientras la lees es de las pocas cosas que se sienten rotas sin estarlo.
 *
 * Con un solo líder no hay carrusel ni puntos: es la misma tarjeta del crack.
 */
export function ScorerSpotlight({
  matches,
  players,
  pending = false,
  onSelect,
}: {
  matches: Match[] | null;
  players: Player[] | null;
  /** Primera carga: sin esto una tarjeta vacía diría que no hay goleador. */
  pending?: boolean;
  onSelect?: (player: Player) => void;
}) {
  const scorers = tiedTopScorers(matches, players);

  if (pending) {
    return <SpotlightCardSkeleton footerHeight={NOTE_HEIGHT} />;
  }

  if (scorers.length === 0) {
    return <NoScorer matches={matches} />;
  }

  if (scorers.length === 1) {
    const only = scorers[0];
    return (
      <ScorerCard entry={only} onSelect={onSelect} position={null} total={1} />
    );
  }

  return <ScorerCarousel onSelect={onSelect} scorers={scorers} />;
}

function ScorerCarousel({
  scorers,
  onSelect,
}: {
  scorers: TiedScorer[];
  onSelect?: (player: Player) => void;
}) {
  const scroller = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  // Arrastrar es tomar el control: a partir de ahí las páginas solo cambian
  // cuando alguien las cambia.
  const [autoRotate, setAutoRotate] = useState(true);
  const reduceMotion = useReducedMotion();

  const total = scorers.length;
  // El recuento se recalcula en cada refresco y puede encoger: sin esta pinza
  // el punto activo se quedaría apuntando a una página que ya no existe.
  const active = Math.min(index, total - 1);

  const goTo = (next: number, animated: boolean) => {
    setIndex(next);
    scroller.current?.scrollTo({ x: next * width, animated });
  };

  // Cadena de esperas y no un intervalo: cada cambio de página —también el que
  // llega arrastrando— vuelve a armar el reloj desde cero, así que nunca salta
  // justo después de que alguien acabe de deslizar.
  useEffect(() => {
    if (!autoRotate || reduceMotion || width === 0) return;

    const timer = setTimeout(() => {
      const next = (active + 1) % total;
      setIndex(next);
      scroller.current?.scrollTo({ x: next * width, animated: true });
    }, ROTATE_MS);

    return () => clearTimeout(timer);
  }, [autoRotate, reduceMotion, width, active, total]);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View onLayout={onLayout} style={{ gap: Spacing.three }}>
      {width === 0 ? (
        // Antes de medir no se puede paginar: una página de ancho cero deja la
        // tarjeta en blanco. Se dibuja la primera y el carrusel entra en el
        // fotograma siguiente, con el ancho ya conocido.
        <ScorerCard
          entry={scorers[0]}
          onSelect={onSelect}
          position={0}
          total={total}
        />
      ) : (
        <ScrollView
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={onSettle}
          onScrollBeginDrag={() => setAutoRotate(false)}
          pagingEnabled
          ref={scroller}
          showsHorizontalScrollIndicator={false}
        >
          {scorers.map((entry, position) => (
            <View key={entry.player.id} style={{ width }}>
              <ScorerCard
                entry={entry}
                onSelect={onSelect}
                position={position}
                total={total}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <Dots
        activeIndex={active}
        items={scorers}
        onSelect={(next) => {
          setAutoRotate(false);
          goTo(next, true);
        }}
      />
    </View>
  );
}

function ScorerCard({
  entry,
  position,
  total,
  onSelect,
}: {
  entry: TiedScorer;
  /** Sitio en el empate, o `null` cuando no hay empate que numerar. */
  position: number | null;
  total: number;
  onSelect?: (player: Player) => void;
}) {
  const games = `${entry.matches} ${entry.matches === 1 ? "partido" : "partidos"}`;
  const note =
    position === null
      ? `en ${games}`
      : `en ${games} · ${position + 1}/${total} empatados`;

  return (
    <SpotlightCard
      footer={
        <Text tone="muted" variant="caption">
          {note}
        </Text>
      }
      onPress={onSelect ? () => onSelect(entry.player) : undefined}
      player={entry.player}
      statLabel="GOLES"
      statValue={entry.goals}
    />
  );
}

function Dots({
  items,
  activeIndex,
  onSelect,
}: {
  items: TiedScorer[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.one,
      }}
    >
      {items.map((entry, position) => {
        const isActive = position === activeIndex;

        return (
          <Pressable
            accessibilityLabel={`Ver goleador ${position + 1} de ${items.length}: ${entry.player.displayName}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={entry.player.id}
            onPress={() => onSelect(position)}
            style={{
              width: DOT_HIT,
              height: DOT_HIT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                height: DOT_SIZE,
                width: isActive ? DOT_ACTIVE_WIDTH : DOT_SIZE,
                borderRadius: Radius.pill,
                backgroundColor: isActive ? Palette.accent : Palette.line,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Sin goleador que coronar. Son dos situaciones distintas y se dicen distinto:
 * que todavía no haya goles, o que quien más marcó sea un invitado —que juega
 * igual, pero no tiene ficha que abrir—. Enseñar al segundo de la tabla como
 * "el goleador" sería un dato falso.
 */
function NoScorer({ matches }: { matches: Match[] | null }) {
  const leader = topScorers(matches, 1)[0];

  return (
    <Text tone="faint" variant="caption">
      {leader
        ? `Quien más ha marcado es ${leader.name}, de última hora, y no tiene ficha en la plantilla.`
        : "Todavía no hay goles registrados."}
    </Text>
  );
}
