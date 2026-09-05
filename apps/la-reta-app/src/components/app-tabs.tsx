import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Fragment } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useTabActionValue, type TabAction } from "@/components/tab-action";
import { Palette, Spacing } from "@/constants/theme";

/**
 * Barra de pestañas nativa. En iOS 26 se dibuja con liquid glass.
 *
 * Cinco destinos, con la acción de armar en el centro: es la posición que
 * Instagram consolidó para la acción que crea algo, y aquí crear es exactamente
 * eso —montar la reta. Cinco es también el máximo que Material permite en
 * Android, así que la lista está llena y cualquier destino nuevo tendrá que
 * colgar de uno de estos, no sumar una sexta pestaña.
 *
 * No se le pasa `backgroundColor` a propósito: un color opaco sustituye al
 * material y el cristal desaparece.
 *
 * El accesorio de abajo lleva la acción principal de la pantalla que esté
 * abierta —el hueco que en Mail ocupa el botón de redactar—. Se encoge y crece
 * con la barra, así que la acción siempre está donde el pulgar ya estaba.
 */
export default function AppTabs() {
  const actions = useTabActionValue();

  return (
    <NativeTabs
      iconColor={Palette.inkMuted}
      // Minimiza la barra al bajar y la devuelve al subir: el gesto que
      // acompaña al liquid glass en iOS 26.
      minimizeBehavior="onScrollDown"
      tintColor={Palette.accent}
    >
      {/* El accesorio se monta solo cuando hay algo que ofrecer. Dejándolo
          siempre, las pantallas sin acción enseñaban una píldora blanca vacía
          flotando sobre la barra: ocupaba sitio y no hacía nada. */}
      {actions.length > 0 ? (
        <NativeTabs.BottomAccessory>
          <ScreenActions actions={actions} />
        </NativeTabs.BottomAccessory>
      ) : null}

      <NativeTabs.Trigger name="(inicio)">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="home"
          sf={{ default: "house", selected: "house.fill" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(plantilla)">
        <NativeTabs.Trigger.Label>Plantilla</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="group"
          sf={{ default: "person.2", selected: "person.2.fill" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(reta)">
        <NativeTabs.Trigger.Label>Armar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="add_circle"
          sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(partidos)">
        <NativeTabs.Trigger.Label>Partidos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="emoji_events"
          sf={{ default: "trophy", selected: "trophy.fill" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(perfil)">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="account_circle"
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/**
 * El botón de la pantalla activa, en cristal.
 *
 * La acción llega por props y no del store: iOS monta dos copias de esto, una
 * por colocación, y la documentación de Expo avisa de que el estado interno no
 * se comparte entre ellas. Leyéndola arriba, las dos dibujan lo mismo.
 *
 * Ocupa todo el accesorio en vez de ser un botón pequeño alineado a la derecha.
 * iOS le da al accesorio el ancho que le sobra a la barra, así que un botón
 * compacto dejaba una píldora blanca enorme y vacía con un círculo verde
 * colgando de la punta: parecía un fallo de maquetación, no una acción. Lleno,
 * se lee como el botón principal que es.
 *
 * No dibuja cristal propio: el accesorio **ya es** una píldora de cristal, así
 * que meterle otra dentro con su relleno alrededor se veía como dos botones,
 * uno encajado en el otro. Aquí solo va el contenido —icono y etiqueta— y la
 * zona pulsable ocupa el accesorio entero.
 *
 * El acento se queda en el icono y el texto, no en el fondo. Este accesorio
 * aparece y desaparece al cambiar de pestaña, y una losa verde entrando de
 * golpe se leía como un parpadeo; en el material de la barra, la transición se
 * lee como que el cristal se alarga.
 *
 * Con la barra encogida se queda solo el icono, un poco mayor para que siga
 * siendo un objetivo cómodo sin la etiqueta al lado. Es lo que hace Mail: al
 * bajar, sus acciones se quedan en icono.
 */
function ScreenActions({ actions }: { actions: TabAction[] }) {
  // Con la barra desplegada el accesorio ocupa el ancho de la pantalla y cabe
  // la etiqueta; encogido comparte fila con la tab bar y solo caben los
  // iconos. Sin distinguirlo, "Repartir otra vez" salía cortado a media
  // palabra —que es peor que no ponerlo—.
  const compact = NativeTabs.BottomAccessory.usePlacement() === "inline";

  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "stretch" }}>
      {actions.map((action, index) => (
        <Fragment key={action.label}>
          {index === 0 ? null : (
            // Un filete y no un hueco: dos botones separados dentro de una
            // misma píldora se leerían otra vez como dos píldoras.
            <View
              style={{
                width: 1,
                marginVertical: Spacing.two,
                backgroundColor: Palette.hairline,
              }}
            />
          )}
          <ScreenAction action={action} compact={compact} />
        </Fragment>
      ))}
    </View>
  );
}

function ScreenAction({
  action,
  compact,
}: {
  action: TabAction;
  compact: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={action.label}
      accessibilityRole="button"
      accessibilityState={{ disabled: action.disabled ?? false }}
      disabled={action.disabled}
      onPress={action.onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.two,
        opacity: action.disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      <Icon
        color={Palette.accent}
        name={action.icon}
        size={compact ? 20 : 18}
        strokeWidth={2}
      />
      {compact ? null : (
        <Text numberOfLines={1} tone="accent" variant="bodyStrong">
          {action.label}
        </Text>
      )}
    </Pressable>
  );
}
