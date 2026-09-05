import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";

/**
 * Tab bar nativa. En iOS 26 se dibuja con liquid glass.
 *
 * Dos cosas la mantienen translúcida y hay que respetarlas:
 *  - **No se pasa `backgroundColor`.** Un color opaco sustituye al material y
 *    el efecto desaparece; la versión anterior lo hacía.
 *  - El color de texto e iconos se da con `DynamicColorIOS`. El glass cambia
 *    de claro a oscuro según lo que tenga detrás y no avisa por callback, así
 *    que un color fijo se vuelve ilegible sobre contenido claro u oscuro.
 */

// Android no tiene el material; ahí sí conviene un color resuelto por tema.
const adaptive =
  Platform.OS === "ios"
    ? DynamicColorIOS({ light: "black", dark: "white" })
    : undefined;

export default function AppTabs() {
  return (
    <NativeTabs
      // Minimiza la barra al bajar y la devuelve al subir: el gesto que
      // acompaña al liquid glass en iOS 26.
      minimizeBehavior="onScrollDown"
      tintColor={adaptive}
      labelStyle={adaptive ? { color: adaptive } : undefined}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Jugadores</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.2", selected: "person.2.fill" }}
          md="group"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="api">
        <NativeTabs.Trigger.Label>API</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: "antenna.radiowaves.left.and.right",
            selected: "antenna.radiowaves.left.and.right",
          }}
          md="wifi"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
