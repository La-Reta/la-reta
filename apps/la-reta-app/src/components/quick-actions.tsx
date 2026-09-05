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
import { Palette, Spacing } from "@/constants/theme";
import { API_URL } from "@/lib/api";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Accesos rápidos, en fila.
 *
 * Solo entra aquí lo que la barra de pestañas **no** alcanza de un toque: el
 * calendario, que es una hoja, y lo que sigue viviendo en la web. Repetir los
 * destinos que ya son pestañas convertiría la fila en decoración.
 *
 * **Las cuatro pesan lo mismo.** Antes la primera iba en verde macizo y el
 * resto en blanco, para señalar cuál acompañaba al banner. Salía caro por dos
 * lados: sobre el papel hueso, una ficha blanca con filete casi invisible se
 * lee como algo apagado —o desactivado— al lado de la verde, y aquí no hay
 * nada apagado: las cuatro son destinos a los que se puede ir. Ahora todas
 * llevan el verde rebajado detrás del icono, que es el mismo recurso que ya
 * usan las filas de ajustes y por la misma razón: sobre el papel a pelo, un
 * trazo de 1.8 se pierde.
 *
 * El verde macizo se queda donde significa algo: el banner de la próxima reta,
 * que es el único bloque de acento de la app.
 *
 * Las que salen al navegador lo dicen: llevan la flecha en diagonal en la
 * esquina y se anuncian como enlace, no como botón. Es la única diferencia
 * entre unas y otras, y no habla de jerarquía sino de destino —a dónde vas—,
 * que es justo lo que conviene saber antes de tocar.
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
};

const TILE_SIZE = 68;
/** Mayor que `Radius.lg`; queda anotado por si algún día se unifica. */
const TILE_RADIUS = 22;
/** Deja aire para etiquetas de una palabra larga sin ensanchar la ficha. */
const TILE_WIDTH = 76;
/** El acento, rebajado a marca: se ve en la esquina sin pelearse con el icono. */
const EXTERNAL_MARK = "rgba(0, 122, 85, 0.5)";

const ACTIONS: Action[] = [
  {
    key: "calendario",
    icon: "calendar",
    label: "Calendario",
    href: "/calendario",
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

  const external = action.webPath !== undefined;

  return (
    <AnimatedPressable
      accessibilityHint={external ? "Se abre en el navegador" : undefined}
      accessibilityLabel={action.label}
      accessibilityRole={external ? "link" : "button"}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
      }}
      style={[
        { width: TILE_WIDTH, alignItems: "center", gap: Spacing.two },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          borderRadius: TILE_RADIUS,
          borderCurve: "continuous",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Palette.accentSoft,
          borderWidth: 1,
          borderColor: Palette.accentLine,
        }}
      >
        <Icon
          color={Palette.accent}
          name={action.icon}
          size={26}
          strokeWidth={1.9}
        />

        {/*
          La marca de salida va dentro de la ficha y no junto a la etiqueta: en
          la esquina es un detalle que se ve sin leerse, y al lado del texto
          competiría con el nombre del destino.
        */}
        {external ? (
          <View style={{ position: "absolute", top: 6, right: 6 }}>
            <Icon
              color={EXTERNAL_MARK}
              name="external"
              size={13}
              strokeWidth={2.2}
            />
          </View>
        ) : null}
      </View>

      <Text numberOfLines={1} style={{ textAlign: "center" }} variant="caption">
        {action.label}
      </Text>
    </AnimatedPressable>
  );
}
