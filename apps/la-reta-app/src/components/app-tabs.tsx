import { NativeTabs } from "expo-router/unstable-native-tabs";

import { Palette } from "@/constants/theme";

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
 */
export default function AppTabs() {
  return (
    <NativeTabs
      iconColor={Palette.inkMuted}
      // Minimiza la barra al bajar y la devuelve al subir: el gesto que
      // acompaña al liquid glass en iOS 26.
      minimizeBehavior="onScrollDown"
      tintColor={Palette.accent}
    >
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
