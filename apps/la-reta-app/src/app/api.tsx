import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  API_URL,
  clearPinToken,
  exchangePin,
  getPinToken,
  request,
} from "@/lib/api";

/**
 * Banco de pruebas de la API. Sirve para dos cosas concretas:
 *
 *  1. Verificar de un vistazo que el dispositivo alcanza el backend. En nativo
 *     `localhost` es el propio teléfono, así que este es el sitio donde se ve
 *     si EXPO_PUBLIC_API_URL apunta a donde debe.
 *  2. Ejercitar el canje de PIN, que es el mecanismo que sustituye a la cookie
 *     httpOnly de la web y no se puede probar desde un navegador.
 */

const PROBES = [
  { label: "GET /api/v1/players", path: "/api/v1/players" },
  { label: "GET /api/v1/matches", path: "/api/v1/matches" },
  { label: "GET /api/v1/matches/1/votes", path: "/api/v1/matches/1/votes" },
] as const;

type ProbeState = {
  status: "idle" | "running" | "ok" | "fail";
  detail?: string;
};

export default function ApiScreen() {
  const theme = useTheme();
  const [results, setResults] = useState<Record<string, ProbeState>>({});
  const [pin, setPin] = useState("");
  const [scope, setScope] = useState<"admin" | "live">("admin");
  const [hasToken, setHasToken] = useState(false);
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    setHasToken((await getPinToken()) !== null);
  }, []);

  useEffect(() => {
    // El setState va dentro del `then`, no en el cuerpo del efecto: React 19
    // avisa de los cascading renders que provoca asignarlo de forma síncrona.
    let active = true;
    getPinToken().then((token) => {
      if (active) {
        setHasToken(token !== null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const runProbes = useCallback(async () => {
    setResults(
      Object.fromEntries(
        PROBES.map((p) => [p.path, { status: "running" as const }])
      )
    );

    for (const probe of PROBES) {
      let next: ProbeState;
      try {
        const payload = await request<unknown>(probe.path);
        const count = Array.isArray(payload)
          ? `${payload.length} registros`
          : "ok";
        next = { status: "ok", detail: count };
      } catch (error) {
        next = {
          status: "fail",
          detail: error instanceof Error ? error.message : "Error desconocido",
        };
      }
      setResults((current) => ({ ...current, [probe.path]: next }));
    }
  }, []);

  const submitPin = useCallback(async () => {
    setPinMessage(null);
    try {
      await exchangePin(pin, scope);
      setPin("");
      setPinMessage(`Token de ${scope} guardado en el keychain.`);
      await refreshToken();
    } catch (error) {
      setPinMessage(
        error instanceof Error ? error.message : "Error desconocido"
      );
    }
  }, [pin, scope, refreshToken]);

  const forgetPin = useCallback(async () => {
    await clearPinToken();
    setPinMessage("Token borrado.");
    await refreshToken();
  }, [refreshToken]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">API</ThemedText>

          <ThemedView style={styles.card} type="backgroundElement">
            <ThemedText themeColor="textSecondary" type="small">
              Backend
            </ThemedText>
            <ThemedText type="code">{API_URL}</ThemedText>
          </ThemedView>

          <Pressable onPress={runProbes} style={styles.button}>
            <ThemedView style={styles.buttonInner} type="backgroundSelected">
              <ThemedText type="smallBold">Probar endpoints</ThemedText>
            </ThemedView>
          </Pressable>

          {PROBES.map((probe) => {
            const state = results[probe.path] ?? { status: "idle" as const };
            return (
              <ThemedView
                key={probe.path}
                style={styles.card}
                type="backgroundElement"
              >
                <View style={styles.probeHeader}>
                  <ThemedText type="code">{probe.label}</ThemedText>
                  <ThemedText type="small">{badge(state.status)}</ThemedText>
                </View>
                {state.detail !== undefined && (
                  <ThemedText themeColor="textSecondary" type="small">
                    {state.detail}
                  </ThemedText>
                )}
              </ThemedView>
            );
          })}

          <ThemedView style={styles.card} type="backgroundElement">
            <ThemedText type="smallBold">Gate de PIN</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              Canjea el PIN por un token firmado. El PIN no se guarda; el token
              sí, en el keychain, y caduca.
            </ThemedText>

            <View style={styles.scopeRow}>
              {(["admin", "live"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setScope(option)}
                  style={styles.scopeButton}
                >
                  <ThemedView
                    style={styles.scopeInner}
                    type={
                      scope === option ? "backgroundSelected" : "background"
                    }
                  >
                    <ThemedText type="small">{option}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setPin}
              placeholder="PIN"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.backgroundSelected },
              ]}
              value={pin}
            />

            <View style={styles.pinActions}>
              <Pressable onPress={submitPin} style={styles.button}>
                <ThemedView
                  style={styles.buttonInner}
                  type="backgroundSelected"
                >
                  <ThemedText type="smallBold">Canjear</ThemedText>
                </ThemedView>
              </Pressable>
              {hasToken && (
                <Pressable onPress={forgetPin} style={styles.button}>
                  <ThemedView style={styles.buttonInner} type="background">
                    <ThemedText type="small">Borrar token</ThemedText>
                  </ThemedView>
                </Pressable>
              )}
            </View>

            <ThemedText themeColor="textSecondary" type="small">
              {hasToken ? "Token guardado." : "Sin token."}
            </ThemedText>
            {pinMessage !== null && (
              <ThemedText type="small">{pinMessage}</ThemedText>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function badge(status: ProbeState["status"]): string {
  if (status === "ok") return "✓";
  if (status === "fail") return "✕";
  if (status === "running") return "…";
  return "–";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  probeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  button: {
    alignSelf: "flex-start",
  },
  buttonInner: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  scopeRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  scopeButton: {
    borderRadius: Spacing.three,
  },
  scopeInner: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pinActions: {
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "center",
  },
});
