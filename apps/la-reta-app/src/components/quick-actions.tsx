import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, ScrollView, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Shadow, Spacing } from "@/constants/theme";
import { API_URL } from "@/lib/api";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Accesos rápidos, en fila.
 *
 * Solo entra aquí lo que la barra de pestañas **no** alcanza de un toque: el
 * calendario, que es una hoja, y lo que sigue viviendo en la web. Repetir los
 * destinos que ya son pestañas convertiría la fila en decoración.
 *
 * El primero va en verde macizo y el resto en blanco. No es capricho: marca
 * cuál es la acción de la tarjeta —el calendario, que acompaña al banner de la
 * próxima reta— y de paso le da a la fila un punto de entrada claro en vez de
 * cuatro iguales.
 *
 * Con cuatro no hace falta desplazar en un teléfono normal; va en `ScrollView`
 * para que añadir el quinto no obligue a rehacer nada.
 */

type Action = {
  key: string;
  icon: IconName;
  label: string;
  /** Ruta de la app, o camino de la web que se abre en el navegador. */
  href?: "/calendario" | "/reta";
  webPath?: string;
  primary?: boolean;
};

const ACTIONS: Action[] = [
  {
    key: "calendario",
    icon: "calendar",
    label: "Calendario",
    href: "/calendario",
    primary: true,
  },
  { key: "once", icon: "ball", label: "Once ideal", href: "/reta" },
  { key: "casacas", icon: "jersey", label: "Casacas", webPath: "/casacas" },
  { key: "ideas", icon: "spark", label: "Ideas", webPath: "/ideas" },
];

export function QuickActions() {
  const router = useRouter();

  const open = (action: Action) => {
    if (action.href) {
      router.push(action.href);
      return;
    }
    if (action.webPath) {
      WebBrowser.openBrowserAsync(`${API_URL}${action.webPath}`);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ gap: Spacing.three, paddingRight: Spacing.four }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {ACTIONS.map((action) => (
        <ActionTile
          action={action}
          key={action.key}
          onPress={() => open(action)}
        />
      ))}
    </ScrollView>
  );
}

function ActionTile({
  action,
  onPress,
}: {
  action: Action;
  onPress: () => void;
}) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.06 }],
  }));

  const primary = action.primary === true;

  return (
    <AnimatedPressable
      accessibilityLabel={action.label}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
      }}
      style={[
        { width: 76, alignItems: "center", gap: Spacing.two },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 22,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: primary ? Palette.accent : Palette.surface,
          borderWidth: 1,
          borderColor: primary ? Palette.accent : Palette.hairline,
          // Sombra normal también en la destacada: `Shadow.accent` dejaba un
          // halo verde que, al pulsarla, se leía como un brillo encendiéndose
          // bajo el dedo. El relleno ya la destaca de sobra.
          boxShadow: Shadow.card,
        }}
      >
        <Icon
          color={primary ? Palette.accentInk : Palette.accent}
          name={action.icon}
          size={26}
          strokeWidth={1.9}
        />
      </View>

      <Text
        numberOfLines={1}
        style={{ textAlign: "center" }}
        tone={primary ? "ink" : "muted"}
        variant="caption"
      >
        {action.label}
      </Text>
    </AnimatedPressable>
  );
}

/** El radio de las fichas es mayor que `Radius.lg`; queda anotado por si algún
 * día se unifica con la escala. */
export const TILE_RADIUS = 22;
