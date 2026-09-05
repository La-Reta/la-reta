import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing, Type } from "@/constants/theme";
import { DEFAULT_GUEST_OVERALL } from "@/lib/guests";
import type { Player } from "@/lib/types";

/** Lo que sube o baja cada toque en el nivel de un invitado. */
const STEP = 1;
/**
 * Lado del objetivo táctil, en puntos. Es el mínimo que pide Apple: los
 * botones medían 30 y errar el toque en un ± que está al lado de otro ± es
 * subirle el nivel a quien no era.
 */
const TAP = 44;
const MIN_OVERALL = 1;
const MAX_OVERALL = 99;

/**
 * Los de última hora: se apuntan con nombre y se les ajusta el nivel a mano.
 *
 * El nivel se edita con dos botones y no escribiendo, porque nadie sabe si el
 * primo de Toño es un 43 o un 46: lo que se hace de verdad es empujar el número
 * arriba o abajo hasta que la reta se ve pareja, y para eso un teclado numérico
 * estorba más de lo que ayuda.
 *
 * "Ataja" es la única posición que se pregunta. Da igual si el invitado juega
 * de medio o de delantero —el repartidor lo acomoda—, pero si puede ponerse al
 * arco cambia el reparto entero.
 */
export function GuestList({
  guests,
  onAdd,
  onRate,
  onRemove,
}: {
  guests: Player[];
  onAdd: (input: { name: string; overall: number; keeper: boolean }) => void;
  onRate: (id: number, overall: number) => void;
  onRemove: (id: number) => void;
}) {
  const [name, setName] = useState("");
  const [keeper, setKeeper] = useState(false);

  function add() {
    if (name.trim().length === 0) return;
    onAdd({ name, overall: DEFAULT_GUEST_OVERALL, keeper });
    setName("");
    setKeeper(false);
  }

  return (
    <View style={{ gap: Spacing.three }}>
      <View style={{ flexDirection: "row", gap: Spacing.two }}>
        <TextInput
          accessibilityLabel="Nombre del invitado"
          autoCapitalize="words"
          onChangeText={setName}
          onSubmitEditing={add}
          placeholder="Nombre del invitado"
          placeholderTextColor={Palette.inkFaint}
          returnKeyType="done"
          selectionColor={Palette.accent}
          style={{
            ...Type.body,
            flex: 1,
            color: Palette.ink,
            height: 44,
            paddingHorizontal: Spacing.three,
            borderRadius: Radius.md,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: Palette.line,
            backgroundColor: Palette.surface,
          }}
          value={name}
        />

        <Pressable
          accessibilityLabel="El invitado ataja"
          accessibilityRole="switch"
          accessibilityState={{ checked: keeper }}
          onPress={() => setKeeper((previous) => !previous)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <View
            style={{
              height: 44,
              paddingHorizontal: Spacing.three,
              borderRadius: Radius.md,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: keeper ? Palette.accent : Palette.line,
              backgroundColor: keeper ? Palette.accentSoft : Palette.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text tone={keeper ? "accent" : "faint"} variant="eyebrow">
              Ataja
            </Text>
          </View>
        </Pressable>
      </View>

      <Button
        disabled={name.trim().length === 0}
        label="Añadir invitado"
        onPress={add}
        size="md"
        variant="ghost"
      />

      {guests.length === 0 ? null : (
        <View>
          {guests.map((guest, index) => (
            <GuestRow
              key={guest.id}
              guest={guest}
              last={index === guests.length - 1}
              onRate={onRate}
              onRemove={onRemove}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function GuestRow({
  guest,
  last,
  onRate,
  onRemove,
}: {
  guest: Player;
  last: boolean;
  onRate: (id: number, overall: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
        paddingVertical: Spacing.two,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: Palette.hairline,
      }}
    >
      <View style={{ flex: 1, gap: Spacing.half }}>
        <Text numberOfLines={1} variant="bodyStrong">
          {guest.displayName}
        </Text>
        <Text tone="faint" variant="caption">
          {guest.position === "GK" ? "Invitado · ataja" : "Invitado"}
        </Text>
      </View>

      <Step
        disabled={guest.overall <= MIN_OVERALL}
        label={`Bajar el nivel de ${guest.displayName}`}
        onPress={() => onRate(guest.id, guest.overall - STEP)}
        symbol="−"
      />

      <Text
        style={{ width: 30, textAlign: "center" }}
        tone="accent"
        variant="statSmall"
      >
        {guest.overall}
      </Text>

      <Step
        disabled={guest.overall >= MAX_OVERALL}
        label={`Subir el nivel de ${guest.displayName}`}
        onPress={() => onRate(guest.id, guest.overall + STEP)}
        symbol="+"
      />

      <Pressable
        accessibilityLabel={`Quitar a ${guest.displayName}`}
        accessibilityRole="button"
        onPress={() => onRemove(guest.id)}
        hitSlop={Spacing.three}
        style={({ pressed }) => ({
          opacity: pressed ? 0.5 : 1,
          padding: Spacing.two,
        })}
      >
        <Icon color={Palette.inkFaint} name="close" size={18} />
      </Pressable>
    </View>
  );
}

function Step({
  symbol,
  label,
  disabled,
  onPress,
}: {
  symbol: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.3 : pressed ? 0.5 : 1 })}
    >
      <View
        style={{
          width: TAP,
          height: TAP,
          borderRadius: Radius.pill,
          borderWidth: 1,
          borderColor: Palette.line,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text tone="muted" variant="bodyStrong">
          {symbol}
        </Text>
      </View>
    </Pressable>
  );
}
