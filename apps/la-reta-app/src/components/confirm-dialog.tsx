import { Modal, Pressable, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

/**
 * Confirmación de una acción que pisa lo que ya hay.
 *
 * Repartir descarta el reparto anterior sin manera de recuperarlo, y en el
 * accesorio el botón está justo donde el pulgar descansa: un roce basta para
 * perder los equipos que la cuadrilla acaba de aceptar. El diálogo cuesta un
 * toque y evita esa pérdida.
 *
 * El detalle dice qué va a pasar con números —cuántos equipos, cuánta gente—
 * en vez de "¿estás seguro?", que no informa de nada.
 */
export function ConfirmDialog({
  title,
  detail,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  detail: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  function confirm() {
    onConfirm();
    onClose();
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
        {/* El toque dentro no cierra: la zona de descarte es la de fuera. */}
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
              <Text variant="heading">{title}</Text>
              <Text tone="muted" variant="caption">
                {detail}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.two }}>
              <Button
                flex={1}
                label="Cancelar"
                onPress={onClose}
                size="md"
                variant="ghost"
              />
              <Button
                flex={1}
                label={confirmLabel}
                onPress={confirm}
                size="md"
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
