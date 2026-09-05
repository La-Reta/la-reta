import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, View } from "react-native";

import { BrandMark, Wordmark } from "@/components/brand-mark";
import { Text } from "@/components/ui/text";
import { MaxContentWidth, Palette, Radius, Spacing } from "@/constants/theme";

/**
 * Navegación para web. `NativeTabs` solo existe en iOS y Android, así que aquí
 * se arma con la API sin estilos de expo-router.
 *
 * No intenta imitar el liquid glass ni la barra inferior: en un navegador ese
 * material no existe y una barra pegada abajo no es la convención. Se traduce a
 * lo que sí lo es —una barra superior con la marca a la izquierda— manteniendo
 * los mismos cinco destinos.
 *
 * Los `TabTrigger` tienen que ser hijos directos del elemento que envuelve
 * `TabList asChild`: el parser de expo-router desenvuelve exactamente una capa
 * y con un `View` de más deja de encontrarlos, y el navegador arranca sin
 * ninguna pantalla.
 */

const DESTINATIONS = [
  { name: "(inicio)", href: "/inicio", label: "Inicio" },
  { name: "(plantilla)", href: "/plantilla", label: "Plantilla" },
  { name: "(reta)", href: "/reta", label: "Armar" },
  { name: "(partidos)", href: "/partidos", label: "Partidos" },
  { name: "(perfil)", href: "/perfil", label: "Perfil" },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabList asChild>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.two,
            width: "100%",
            maxWidth: MaxContentWidth,
            alignSelf: "center",
            paddingHorizontal: Spacing.four,
            paddingVertical: Spacing.two,
            borderBottomWidth: 1,
            borderBottomColor: Palette.hairline,
            backgroundColor: Palette.paper,
          }}
        >
          <Brand />

          {DESTINATIONS.map((destination) => (
            <TabTrigger
              asChild
              href={destination.href}
              key={destination.name}
              name={destination.name}
            >
              <TabButton>{destination.label}</TabButton>
            </TabTrigger>
          ))}
        </View>
      </TabList>

      {/* Después de la barra para que ocupe lo que queda: el orden en el árbol
          es el orden en pantalla, y con el slot delante la barra caía fuera de
          la ventana. */}
      <TabSlot style={{ flex: 1 }} />
    </Tabs>
  );
}

function Brand() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
        marginRight: "auto",
      }}
    >
      <BrandMark size={24} />
      <Wordmark size={13} />
    </View>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          paddingVertical: Spacing.one,
          paddingHorizontal: Spacing.three,
          borderRadius: Radius.pill,
          backgroundColor: isFocused ? Palette.accentSoft : "transparent",
        }}
      >
        <Text tone={isFocused ? "accent" : "muted"} variant="caption">
          {children}
        </Text>
      </View>
    </Pressable>
  );
}
