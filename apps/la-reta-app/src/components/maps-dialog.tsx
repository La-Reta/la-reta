import { mapsUrl, VENUE } from "@repo/reta/venue";
import { Linking, Modal, Pressable, View } from "react-native";

import { AppleMark, GoogleMapsMark } from "@/components/ui/brand-icon";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

/**
 * Con qué mapa abrir la cancha.
 *
 * Se pregunta en vez de decidir por la app: en un mismo grupo hay quien vive en
 * Google Maps y quien nunca ha salido de Apple Maps, y mandar a alguien a la
 * app que no usa le cuesta dos toques más y perder el sitio.
 *
 * Cada opción lleva su logo de verdad, con sus colores. Es lo único de la app
 * que no se dibuja de línea, y con razón: una marca redibujada al estilo de la
 * casa deja de reconocerse de un vistazo, que es exactamente para lo que está
 * ahí.
 */
export function MapsDialog({ onClose }: { onClose: () => void }) {
  async function open(provider: "google" | "apple") {
    onClose();
    await Linking.openURL(mapsUrl(provider));
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <Pressable
        accessibilityLabel="Cerrar"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(9, 9, 11, 0.35)",
          justifyContent: "center",
          padding: Spacing.four,
        }}
      >
        <Pressable onPress={() => undefined}>
          <View
            style={{
              gap: Spacing.three,
              padding: Spacing.four,
              borderRadius: Radius.lg,
              borderCurve: "continuous",
              backgroundColor: Palette.surface,
              boxShadow: Shadow.raised,
            }}
          >
            <View style={{ gap: Spacing.one }}>
              <Text variant="heading">Cómo llegar</Text>
              <Text tone="muted" variant="caption">
                {VENUE.name} · {VENUE.city}
              </Text>
            </View>

            <View>
              <Option
                label="Google Maps"
                mark={<GoogleMapsMark />}
                onPress={() => open("google")}
              />
              <Option
                label="Apple Maps"
                last
                mark={<AppleMark color={Palette.ink} />}
                onPress={() => open("apple")}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({
  label,
  mark,
  last = false,
  onPress,
}: {
  label: string;
  mark: React.ReactNode;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Abrir en ${label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
          paddingVertical: Spacing.three,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: Palette.hairline,
        }}
      >
        {mark}
        <Text style={{ flex: 1 }} variant="body">
          {label}
        </Text>
        <Icon color={Palette.inkFaint} name="chevron" size={14} />
      </View>
    </Pressable>
  );
}
