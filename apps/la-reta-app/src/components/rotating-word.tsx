import { useEffect, useState } from "react";
import { Animated, Easing, type StyleProp, type TextStyle } from "react-native";

/**
 * La palabra que gira dentro de «La Reta ___».
 *
 * Es el guiño que la web ya tenía y aquí faltaba: la frase la escribe la gente
 * desde /palabras y el banner las va pasando.
 *
 * Tres decisiones que sostienen el resto:
 *
 *  - **No se monta ni se desmonta nada.** Una animación de entrada/salida
 *    tendría las dos palabras vivas a la vez durante el relevo y la línea daría
 *    un salto de ancho. Aquí solo cambia el texto de una vista que siempre
 *    está, en el instante en que es invisible, así que no hay salto.
 *  - **`Animated` de React Native y no Reanimated**, que es lo que usa el resto
 *    de la app. Aquí el turno lo lleva una cadena de temporizadores en JS y el
 *    relevo cambia el texto con `setState`, así que la animación ya vive en ese
 *    hilo: sacarla al de UI obligaría a volver con `scheduleOnRN` en cada vuelta
 *    para 220 ms de opacidad, y a silenciar el `exhaustive-deps` del efecto.
 *    Reanimated es para lo que sigue al dedo; esto no.
 *  - **Toda la coreografía en un solo efecto**, para que el turno se toque
 *    desde un único sitio.
 *
 * La espera se cuenta *después* de cada relevo, no con un `setInterval` fijo:
 * así el fundido nunca compite con el siguiente turno.
 */

/** Lo que se queda quieta cada palabra. */
const HOLD = 2600;
const FADE = 220;
/** Sube al irse y la siguiente baja a su sitio, como en la web. */
const RISE = 6;

function nextRandom(current: number, length: number): number {
  if (length <= 1) return current;

  let next = current;
  while (next === current) next = Math.floor(Math.random() * length);

  return next;
}

export type RotatingWordProps = {
  words: string[];
  style?: StyleProp<TextStyle>;
};

export function RotatingWord({ words, style }: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  // Con `useState` y no con `useRef`: el valor es estable igual, pero un ref
  // no se puede leer durante el render y este viaja en el `style`.
  const [phase] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (words.length < 2) return;

    let timer: ReturnType<typeof setTimeout>;

    // Declaradas como funciones y no como constantes porque se llaman entre
    // ellas: el turno es un ciclo, y con `const` una de las dos se usaría antes
    // de existir.
    function leave() {
      Animated.timing(phase, {
        toValue: 0,
        duration: FADE,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) commit();
      });
    }

    function commit() {
      setIndex((current) => nextRandom(current, words.length));
      Animated.timing(phase, {
        toValue: 1,
        duration: FADE,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      timer = setTimeout(leave, HOLD);
    }

    timer = setTimeout(leave, HOLD);

    return () => {
      clearTimeout(timer);
      phase.stopAnimation();
    };
  }, [words.length, phase]);

  return (
    <Animated.Text
      numberOfLines={1}
      style={[
        style,
        {
          opacity: phase,
          transform: [
            {
              translateY: phase.interpolate({
                inputRange: [0, 1],
                outputRange: [-RISE, 0],
              }),
            },
          ],
        },
      ]}
    >
      {words[index] ?? words[0] ?? ""}
    </Animated.Text>
  );
}
