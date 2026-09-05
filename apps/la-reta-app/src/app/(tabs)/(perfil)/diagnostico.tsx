import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import {
  API_URL,
  clearPinToken,
  exchangePin,
  getPinToken,
  request,
} from "@/lib/api";

/**
 * Banco de pruebas de la API. Sirve para dos cosas que no se pueden comprobar
 * desde ningún otro sitio:
 *
 *  1. Ver si el dispositivo alcanza el backend. En nativo `localhost` es el
 *     propio teléfono, así que aquí se descubre si EXPO_PUBLIC_API_URL apunta a
 *     donde debe.
 *  2. Ejercitar el canje de PIN, que sustituye a la cookie httpOnly de la web y
 *     por tanto no se puede probar en un navegador.
 */

const PROBES = [
  { label: "GET /api/v1/players", path: "/api/v1/players" },
  { label: "GET /api/v1/matches", path: "/api/v1/matches" },
  { label: "GET /api/v1/matches/1/votes", path: "/api/v1/matches/1/votes" },
] as const;

type ProbeStatus = "idle" | "running" | "ok" | "fail";

interface ProbeState {
  status: ProbeStatus;
  detail?: string;
}

const BADGE: Record<ProbeStatus, string> = {
  idle: "–",
  running: "…",
  ok: "✓",
  fail: "✕",
};

export default function DiagnosticoScreen() {
  const [results, setResults] = useState<Record<string, ProbeState>>({});
  const [pin, setPin] = useState("");
  const [scope, setScope] = useState<"admin" | "live">("admin");
  const [hasToken, setHasToken] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    setHasToken((await getPinToken()) !== null);
  }, []);

  useEffect(() => {
    // El setState va dentro del `then`, no en el cuerpo del efecto: React 19
    // avisa de los renders en cascada que provoca asignarlo de forma síncrona.
    let active = true;
    getPinToken().then((token) => {
      if (active) setHasToken(token !== null);
    });
    return () => {
      active = false;
    };
  }, []);

  const runProbes = useCallback(async () => {
    setResults(
      Object.fromEntries(
        PROBES.map((probe) => [probe.path, { status: "running" as const }])
      )
    );

    for (const probe of PROBES) {
      let next: ProbeState;
      try {
        const payload = await request<unknown>(probe.path);
        next = {
          status: "ok",
          detail: Array.isArray(payload)
            ? `${payload.length} registros`
            : "respuesta ok",
        };
      } catch (error) {
        next = { status: "fail", detail: describe(error) };
      }
      setResults((current) => ({ ...current, [probe.path]: next }));
    }
  }, []);

  const submitPin = useCallback(async () => {
    setMessage(null);
    try {
      await exchangePin(pin, scope);
      setPin("");
      setMessage(`Token de ${scope} guardado en el keychain.`);
      await refreshToken();
    } catch (error) {
      setMessage(describe(error));
    }
  }, [pin, scope, refreshToken]);

  const forgetPin = useCallback(async () => {
    await clearPinToken();
    setMessage("Token borrado.");
    await refreshToken();
  }, [refreshToken]);

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.five,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Section title="Backend">
        <Surface variant="sunken">
          <Text selectable variant="mono">
            {API_URL}
          </Text>
        </Surface>
      </Section>

      <Section title="Endpoints">
        <View style={{ gap: Spacing.two }}>
          {PROBES.map((probe) => {
            const state = results[probe.path] ?? { status: "idle" as const };

            return (
              <Surface key={probe.path} style={{ gap: Spacing.two }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: Spacing.two,
                  }}
                >
                  <Text selectable variant="mono">
                    {probe.label}
                  </Text>
                  <Text tone={toneFor(state.status)} variant="bodyStrong">
                    {BADGE[state.status]}
                  </Text>
                </View>
                {state.detail === undefined ? null : (
                  <Text selectable tone="muted" variant="caption">
                    {state.detail}
                  </Text>
                )}
              </Surface>
            );
          })}

          <Button
            label="Probar endpoints"
            onPress={runProbes}
            size="md"
            style={{ alignSelf: "flex-start" }}
            variant="glass"
          />
        </View>
      </Section>

      <Section meta={hasToken ? "con token" : "sin token"} title="Gate de PIN">
        <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
          <Text tone="muted" variant="caption">
            Canjea el PIN por un token firmado. El PIN no se guarda; el token
            sí, en el keychain, y caduca.
          </Text>

          <View style={{ flexDirection: "row", gap: Spacing.two }}>
            {(["admin", "live"] as const).map((option) => (
              <Button
                key={option}
                label={option}
                onPress={() => setScope(option)}
                size="md"
                style={{
                  borderRadius: Radius.pill,
                  backgroundColor:
                    scope === option ? Palette.accentSoft : "transparent",
                }}
                variant="plain"
              />
            ))}
          </View>

          <Field
            label="PIN"
            onChangeText={setPin}
            placeholder="••••"
            secureTextEntry
            value={pin}
          />

          <View style={{ flexDirection: "row", gap: Spacing.two }}>
            <Button
              flex={1}
              label="Canjear"
              onPress={submitPin}
              size="md"
              variant="primary"
            />
            {hasToken ? (
              <Button
                label="Borrar token"
                onPress={forgetPin}
                size="md"
                variant="plain"
              />
            ) : null}
          </View>

          {message === null ? null : (
            <Text selectable tone="muted" variant="caption">
              {message}
            </Text>
          )}
        </Surface>
      </Section>
    </ScrollView>
  );
}

function toneFor(status: ProbeStatus) {
  if (status === "ok") return "accent" as const;
  if (status === "fail") return "danger" as const;
  return "faint" as const;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido";
}
