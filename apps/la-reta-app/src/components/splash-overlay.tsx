import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/**
 * Animación de inicio: cubre la pantalla con el logo, oculta el splash nativo
 * en cuanto está montada y se desvanece.
 *
 * El relevo es el detalle importante. `SplashScreen.hideAsync()` se llama en
 * el `onLayout` de la capa estática, no antes: así el splash nativo solo
 * desaparece cuando este overlay ya está pintado encima, y no hay un parpadeo
 * entre los dos. La animación arranca después.
 */

const DURATION = 600;

const splashKeyframe = new Keyframe({
  0: { transform: [{ scale: 1 }], opacity: 1 },
  20: { opacity: 1 },
  70: { opacity: 0, easing: Easing.elastic(0.7) },
  100: { opacity: 0, transform: [{ scale: 1 }], easing: Easing.elastic(0.7) },
});

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const image = (
    <Image
      style={styles.image}
      source={require("@/assets/images/expo-logo.png")}
    />
  );

  if (!animate) {
    return (
      <View
        onLayout={() => {
          SplashScreen.hideAsync().finally(() => setAnimate(true));
        }}
        style={styles.splashOverlay}
      >
        {image}
      </View>
    );
  }

  return (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        "worklet";
        if (finished) {
          // El desmontaje tiene que volver al hilo de JS: el callback corre en
          // el hilo de UI de Reanimated, donde setState no existe.
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}
    >
      {image}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 76,
    height: 71,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#208AEF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
});
