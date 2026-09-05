import { useMemo } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import {
  MONTH_NAMES,
  monthGrid,
  WEEKDAY_INITIALS,
  type CalendarDay,
} from "@/lib/reta-date";

/**
 * Calendario del mes, con los días de reta marcados.
 *
 * Es una cuadrícula normal y corriente a propósito: la cadencia de catorce días
 * se entiende sola cuando se ven los jueves marcados saltando semana de por
 * medio, y eso una tira horizontal no lo enseña.
 *
 * La semana empieza en lunes, como en México y casi toda Latinoamérica.
 *
 * El mes que se enseña lo controla la pantalla, no este componente: así el
 * botón "Hoy" puede vivir arriba, en la cabecera de la hoja, que es donde la
 * gente lo busca.
 */

/** Cuánto se puede viajar. Atrás poco, porque el historial vive en Partidos. */
export const MIN_MONTH_OFFSET = -3;
export const MAX_MONTH_OFFSET = 5;

export function RetaMonth({
  offset,
  onOffsetChange,
}: {
  offset: number;
  onOffsetChange: (offset: number) => void;
}) {
  const today = useMemo(() => new Date(), []);

  const { year, month, weeks } = useMemo(() => {
    const cursor = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1)
    );
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();

    return { year: y, month: m, weeks: monthGrid(y, m, today) };
  }, [today, offset]);

  return (
    <View style={{ gap: Spacing.three }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Arrow
          direction="prev"
          disabled={offset <= MIN_MONTH_OFFSET}
          onPress={() => onOffsetChange(offset - 1)}
        />
        <Text variant="heading">
          {MONTH_NAMES[month]} {year}
        </Text>
        <Arrow
          direction="next"
          disabled={offset >= MAX_MONTH_OFFSET}
          onPress={() => onOffsetChange(offset + 1)}
        />
      </View>

      <View style={{ flexDirection: "row" }}>
        {WEEKDAY_INITIALS.map((initial, index) => (
          <View
            key={`${initial}-${index}`}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text tone="faint" variant="eyebrow">
              {initial}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: Spacing.one }}>
        {weeks.map((week) => (
          <View key={week[0].ymd} style={{ flexDirection: "row" }}>
            {week.map((day) => (
              <Day day={day} key={day.ymd} />
            ))}
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.two,
          paddingTop: Spacing.two,
          borderTopWidth: 1,
          borderTopColor: Palette.hairline,
        }}
      >
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: Palette.accent,
          }}
        />
        <Text tone="muted" variant="caption">
          Día de reta · jueves cada 14 días, 7:00 pm
        </Text>
      </View>
    </View>
  );
}

function Day({ day }: { day: CalendarDay }) {
  return (
    <View
      style={{ flex: 1, alignItems: "center", paddingVertical: Spacing.half }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: day.isReta ? Palette.accent : "transparent",
          borderWidth: day.isToday && !day.isReta ? 1.5 : 0,
          borderColor: Palette.ink,
          opacity: day.isOutside ? 0.28 : 1,
        }}
      >
        <Text
          style={{ fontVariant: ["tabular-nums"] }}
          tone={day.isReta ? "onAccent" : "ink"}
          variant={day.isReta || day.isToday ? "bodyStrong" : "body"}
        >
          {day.day}
        </Text>
      </View>
    </View>
  );
}

function Arrow({
  direction,
  disabled,
  onPress,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={
        direction === "prev" ? "Mes anterior" : "Mes siguiente"
      }
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.3 : pressed ? 0.5 : 1 })}
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
          // El mismo chevron, girado media vuelta para el mes anterior.
          transform: [{ rotate: direction === "prev" ? "180deg" : "0deg" }],
        }}
      >
        <Icon color={Palette.ink} name="chevron" size={16} />
      </View>
    </Pressable>
  );
}
