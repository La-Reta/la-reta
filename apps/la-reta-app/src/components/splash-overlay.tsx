import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { markGeometry, Wordmark } from "@/components/brand-mark";
import { Motion, Palette, Radius, Spacing } from "@/constants/theme";

/**
 * Bienvenida animada. La espera que cubre es real —las tipografías de la web
 * se descargan aquí—, así que la animación informa en vez de decorar.
 *
 * Tres cosas que conviene no tocar sin querer:
 *
 *  1. **El relevo del splash nativo.** `hideAsync()` se llama al montar esta
 *     capa, nunca antes: el splash del sistema solo se retira cuando ya hay
 *     algo pintado encima, así que no hay parpadeo entre los dos. Se hacía
 *     desde un `onLayout`, pero en web ese callback no llega y la bienvenida
 *     se quedaba congelada en la primera fase.
 *  2. **El logotipo aparece después de las fuentes.** Está en Oswald; si se
 *     dibujara antes se vería un instante en la cara del sistema y saltaría al
 *     cargar. Por eso entra en la segunda fase, cuando `ready` ya es cierto.
 *  3. **El filete de carga no miente.** Avanza hasta el 70 % mientras carga y
 *     solo se completa cuando termina de verdad.
 */

const MARK_SIZE = 132;
const DRAW = 620;
const REVEAL = 380;
const HOLD = 260;

type Stage = "handoff" | "loading" | "leaving" | "gone";

export function AnimatedSplashOverlay({ ready }: { ready: boolean }) {
  const [stage, setStage] = useState<Stage>("handoff");
  const [drawn, setDrawn] = useState(false);

  // Relevo del splash nativo: se oculta en cuanto esta capa está montada, no
  // antes, para que no haya un hueco en blanco entre las dos.
  useEffect(() => {
    let cancelled = false;
    SplashScreen.hideAsync().finally(() => {
      if (!cancelled) setStage("loading");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const draw = useSharedValue(0);
  const reveal = useSharedValue(0);
  const load = useSharedValue(0);
  const leave = useSharedValue(0);

  // Toda la coreografía vive en un solo efecto a propósito. Repartir las
  // fases en varios efectos obligaba a tocar el mismo valor compartido desde
  // dos sitios, que es justo lo que el compilador de React no permite —y con
  // razón: dos efectos peleándose por una animación es una carrera esperando
  // a ocurrir.
  //
  // Los shared values quedan fuera de las dependencias: son referencias
  // estables, y listarlos los convertiría en argumentos del hook, lo que
  // prohibiría mutarlos justo aquí dentro.
  useEffect(() => {
    if (stage === "leaving") {
      leave.value = withTiming(
        1,
        { duration: Motion.slow, easing: Easing.in(Easing.cubic) },
        (finished) => {
          "worklet";
          if (finished) {
            // El desmontaje vuelve al hilo de JS: este callback corre en el
            // hilo de UI de Reanimated, donde no existe setState.
            scheduleOnRN(setStage, "gone" as Stage);
          }
        }
      );
      return;
    }

    if (stage !== "loading") return;

    // Fase 1: la marca se dibuja y el filete avanza mientras cargan las
    // tipografías. Se para en 0.7 porque todavía no ha terminado nada.
    if (!drawn) {
      draw.value = withTiming(1, {
        duration: DRAW,
        easing: Easing.out(Easing.cubic),
      });
      load.value = withTiming(0.7, {
        duration: 1400,
        easing: Easing.out(Easing.quad),
      });

      const timer = setTimeout(() => setDrawn(true), DRAW);
      return () => clearTimeout(timer);
    }

    if (!ready) return;

    // Fase 2: con todo cargado se completa el filete, entra el logotipo en
    // Oswald —ya con la fuente real— y la capa se retira.
    load.value = withTiming(1, { duration: Motion.quick });
    reveal.value = withSpring(1, { damping: 18, stiffness: 160 });

    const timer = setTimeout(() => setStage("leaving"), REVEAL + HOLD);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver arriba
  }, [stage, drawn, ready]);

  const layerStyle = useAnimatedStyle(() => ({
    opacity: 1 - leave.value,
    transform: [{ scale: 1 + leave.value * 0.04 }],
  }));

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: interpolate(draw.value, [0, 0.35], [0, 1], "clamp"),
    transform: [{ scale: interpolate(draw.value, [0, 1], [0.94, 1], "clamp") }],
  }));

  const halfwayStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(draw.value, [0.2, 0.75], [0, 1], "clamp") },
    ],
  }));

  const circleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(draw.value, [0.5, 0.7], [0, 1], "clamp"),
    transform: [
      { scale: interpolate(draw.value, [0.5, 1], [0.4, 1], "clamp") },
    ],
  }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: interpolate(reveal.value, [0, 1], [12, 0]) }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    opacity: 1 - reveal.value,
  }));

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: load.value }],
  }));

  if (stage === "gone") return null;

  const g = markGeometry(MARK_SIZE);

  return (
    <Animated.View style={[styles.layer, layerStyle]}>
      <View style={styles.stack}>
        <Animated.View
          style={[
            fieldStyle,
            {
              width: g.width,
              height: g.height,
              borderRadius: g.radius,
              borderCurve: "continuous",
              borderWidth: g.stroke,
              borderColor: Palette.ink,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Animated.View
            style={[
              halfwayStyle,
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                width: g.stroke,
                backgroundColor: Palette.ink,
                transformOrigin: "top",
              },
            ]}
          />
          <Animated.View
            style={[
              circleStyle,
              {
                width: g.circle,
                height: g.circle,
                borderRadius: g.circle / 2,
                borderWidth: g.stroke,
                borderColor: Palette.accent,
                backgroundColor: Palette.paper,
              },
            ]}
          />
        </Animated.View>

        <View style={styles.footer}>
          {/*
            El logotipo no se monta hasta que la fuente está: una vista de texto
            nativa resuelve su familia al crearse y no la revisa después, así
            que si nace antes que Oswald se queda con la del sistema para
            siempre — y aquí solo cambia la opacidad, que viaja por el hilo de
            UI sin re-renderizar. El hueco queda reservado para que nada salte.
          */}
          <View style={styles.wordSlot}>
            {ready ? (
              <Animated.View style={wordStyle}>
                <Wordmark size={26} />
              </Animated.View>
            ) : null}
          </View>

          <Animated.View style={[styles.track, trackStyle]}>
            <Animated.View style={[styles.bar, barStyle]} />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    inset: 0,
    backgroundColor: Palette.paper,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  stack: {
    alignItems: "center",
    gap: Spacing.five,
  },
  footer: {
    alignItems: "center",
    gap: Spacing.three,
  },
  wordSlot: {
    height: 34,
    justifyContent: "center",
  },
  track: {
    // En columna y no superpuesta: estaba en posición absoluta sobre el mismo
    // punto que el logotipo, y durante el relevo se veía una línea cruzando el
    // texto.
    width: 88,
    height: 2,
    borderRadius: Radius.pill,
    backgroundColor: Palette.line,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.pill,
    backgroundColor: Palette.accent,
    transformOrigin: "left",
  },
});
