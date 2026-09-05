import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { isClerkConfigured } from "@/components/auth-provider";
import { SignedInRedirect } from "@/components/auth/signed-in-redirect";
import { BrandMark, Wordmark } from "@/components/brand-mark";
import { Notice } from "@/components/notice";
import { StatStrip } from "@/components/stat-strip";
import { Button } from "@/components/ui/button";
import { Row } from "@/components/ui/row";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { MaxContentWidth, Palette, Spacing } from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";

/**
 * Portada para quien todavía no ha entrado.
 *
 * Enseña **prueba, no contenido**. Las cifras agregadas —cuánta gente, cuántos
 * partidos, cuántos goles— demuestran que la reta existe y está viva; la ficha
 * del crack, el goleador y el último marcador viven dentro, porque son
 * justamente aquello a lo que se entra. Cuando esta pantalla los enseñaba,
 * entrar dejaba de tener sentido.
 *
 * El orden de los botones tampoco es estético. La acción que queremos que se
 * elija —crear cuenta— va a la derecha, que en lectura de izquierda a derecha
 * es la dirección de "seguir", y en sólido para que gane por peso; iniciar
 * sesión queda a la izquierda en cristal. Los dos flotan abajo, dentro del arco
 * del pulgar.
 *
 * Y por eso mismo la barra se apoya en un **degradado de papel**. Flotando sin
 * nada detrás, el contenido seguía pasando por debajo y "Iniciar sesión" —que
 * es cristal, es decir, translúcido por definición— se leía sobre el texto de
 * la lista. El degradado sube desde el papel opaco hasta transparente en unos
 * 72 pt: la barra queda sobre fondo limpio, el contenido se desvanece en vez
 * de cortarse contra un filete, y no hay que oscurecer nada para lograrlo.
 */

/** Lo que tarda el papel en desvanecerse por encima de la barra. */
const SCRIM_FADE = 72;

const INSIDE = [
  {
    icon: "jersey" as const,
    title: "Tu ficha con stats",
    detail: "Reclama tu carta y mira cómo se mueve tu overall reta a reta.",
  },
  {
    icon: "ball" as const,
    title: "Equipos parejos",
    detail:
      "Se arman igualando nivel y cubriendo cada posición, no por orden de llegada.",
  },
  {
    icon: "trophy" as const,
    title: "Marcador y MVP",
    detail:
      "Goles, asistencias, historial de partidos y la votación de cada reta.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { players, summary, error, refetch } = useReta();

  const pending = players === null;
  const barHeight = 54 + Spacing.two * 2;

  return (
    <View style={{ flex: 1, backgroundColor: Palette.paper }}>
      {isClerkConfigured ? <SignedInRedirect /> : null}

      <ScrollView
        contentContainerStyle={{
          alignSelf: "center",
          width: "100%",
          maxWidth: MaxContentWidth,
          gap: Spacing.five,
          paddingHorizontal: Spacing.four,
          paddingTop: insets.top + Spacing.four,
          paddingBottom: barHeight + insets.bottom + Spacing.five,
        }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.two,
          }}
        >
          <BrandMark size={30} />
          <Wordmark size={16} />
        </View>

        <View style={{ gap: Spacing.three }}>
          <Text tone="accent" variant="eyebrow">
            Manager de fútbol amateur
          </Text>
          <Text variant="hero">Arma la reta como un club</Text>
          <Text tone="muted" variant="body">
            Fichas con stats, equipos parejos y el marcador en vivo. Lo que ya
            vive en la web, ahora en la cancha.
          </Text>
        </View>

        <StatStrip
          fields={["squad", "matches", "goals"]}
          pending={pending}
          summary={summary}
        />

        {error === null ? null : (
          <Notice
            actionLabel="Reintentar"
            detail={error}
            onAction={refetch}
            title="No pudimos leer los datos de la reta"
          />
        )}

        <Section title="Lo que hay dentro">
          <View>
            {INSIDE.map((item, index) => (
              <Row
                detail={item.detail}
                icon={item.icon}
                key={item.title}
                last={index === INSIDE.length - 1}
                title={item.title}
              />
            ))}
          </View>
        </Section>

        <View style={{ gap: Spacing.three }}>
          <Button
            label="Entrar sin cuenta"
            onPress={() => router.replace("/inicio")}
            variant="ghost"
          />
          <Text style={{ textAlign: "center" }} tone="faint" variant="caption">
            {pending
              ? "Buscando la reta…"
              : `Datos en vivo · ${summary.squad} jugadores registrados`}
          </Text>
        </View>
      </ScrollView>

      {/*
        Dos piezas y no un degradado de punta a punta: el tramo que va detrás de
        los botones es papel macizo —da igual cuánto mida el hueco seguro del
        teléfono— y el degradado solo cubre los 72 pt de arriba, donde el
        contenido tiene que desaparecer.
      */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <Svg height={SCRIM_FADE} width="100%">
          <Defs>
            <LinearGradient id="welcome-scrim" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={Palette.paper} stopOpacity={0} />
              <Stop offset="0.5" stopColor={Palette.paper} stopOpacity={0.55} />
              <Stop offset="0.8" stopColor={Palette.paper} stopOpacity={0.9} />
              <Stop offset="1" stopColor={Palette.paper} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#welcome-scrim)" height="100%" width="100%" />
        </Svg>
        <View
          style={{
            height: barHeight + insets.bottom,
            backgroundColor: Palette.paper,
          }}
        />
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          paddingHorizontal: Spacing.four,
          paddingBottom: insets.bottom + Spacing.three,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: Spacing.two,
            width: "100%",
            maxWidth: MaxContentWidth - Spacing.four * 2,
          }}
        >
          <Button
            flex={1}
            label="Iniciar sesión"
            onPress={() => router.push("/sign-in")}
            variant="glass"
          />
          <Button
            flex={1.3}
            label="Crear cuenta"
            onPress={() => router.push("/sign-up")}
            variant="primary"
          />
        </View>
      </View>
    </View>
  );
}
