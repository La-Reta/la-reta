import { VENUE } from "@repo/reta/venue";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapsDialog } from "@/components/maps-dialog";
import { RetaMonth } from "@/components/reta-month";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { MaxContentWidth, Palette, Radius, Spacing } from "@/constants/theme";
import { closeOverlay } from "@/lib/navigation";
import { countdownLabel, nextReta } from "@/lib/reta-date";
import { addRetaToCalendar } from "@/lib/reta-calendar";

/**
 * Calendario de retas, en hoja modal.
 *
 * Vive en la raíz y no dentro de una pestaña para poder abrirse desde
 * cualquier sitio; hoy lo hace el botón del banner de Inicio.
 *
 * El mes visible lo lleva esta pantalla y no la cuadrícula, porque "Hoy" tiene
 * que estar arriba —junto al cierre, donde iOS lo pone en su propio
 * calendario— y no enterrado entre las flechas.
 */
export default function CalendarioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reta = nextReta();
  const [offset, setOffset] = useState(0);
  const [maps, setMaps] = useState(false);

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.four,
        padding: Spacing.four,
        paddingTop: Math.max(insets.top, Spacing.four),
        paddingBottom: insets.bottom + Spacing.five,
      }}
      style={{ flex: 1, backgroundColor: Palette.paper }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.two,
        }}
      >
        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text tone="accent" variant="eyebrow">
            {countdownLabel(reta.daysUntil)}
          </Text>
          <Text variant="title">{reta.label}</Text>
        </View>

        {/* Solo aparece si te fuiste del mes actual: un "Hoy" que no lleva a
            ningún sitio distinto es un botón que no hace nada. */}
        {offset === 0 ? null : (
          <Pressable
            accessibilityLabel="Volver al mes actual"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setOffset(0)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <View
              style={{
                height: 36,
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: Palette.accent,
                backgroundColor: Palette.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text tone="accent" variant="caption">
                Hoy
              </Text>
            </View>
          </Pressable>
        )}

        <Pressable
          accessibilityLabel="Cerrar el calendario"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => closeOverlay(router, "/inicio")}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: Palette.line,
              backgroundColor: Palette.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color={Palette.ink} name="close" size={16} strokeWidth={2} />
          </View>
        </Pressable>
      </View>

      {/* Las dos cosas que se hacen con una fecha: apuntarla y llegar. Van
          arriba, junto al día, y no al final: quien abre el calendario ya sabe
          cuándo es, lo que le falta es meterlo en su semana. */}
      <View style={{ gap: Spacing.two }}>
        <View style={{ flexDirection: "row", gap: Spacing.two }}>
          <Button
            flex={1}
            icon="calendar"
            label="Agregar al calendario"
            onPress={addRetaToCalendar}
            size="md"
            variant="ghost"
          />
          <Button
            flex={1}
            icon="pin"
            label="Cómo llegar"
            onPress={() => setMaps(true)}
            size="md"
            variant="ghost"
          />
        </View>

        <Text tone="faint" variant="caption">
          {VENUE.name} · {VENUE.city}
        </Text>
      </View>

      <Section title="Calendario">
        <RetaMonth offset={offset} onOffsetChange={setOffset} />
      </Section>

      {maps ? <MapsDialog onClose={() => setMaps(false)} /> : null}
    </ScrollView>
  );
}
