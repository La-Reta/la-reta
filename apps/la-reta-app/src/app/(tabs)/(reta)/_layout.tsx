import { Stack, useRouter } from "expo-router";

import { HeaderAction } from "@/components/header-action";
import { TabStack } from "@/components/tab-stack";

export default function RetaLayout() {
  const router = useRouter();

  return (
    <TabStack>
      <Stack.Screen
        name="reta"
        options={{
          title: "Armar reta",
          // Convocar es la única acción de la pantalla, y no depende de nada
          // que ella sepa, así que se declara aquí y no dentro.
          headerRight: () => (
            <HeaderAction
              hint="Abre la convocatoria para marcar quién viene hoy"
              icon="person-plus"
              label="Convocar"
              onPress={() => router.push("/convocatoria")}
            />
          ),
        }}
      />
      {/* La cabecera de `convocatoria` la pone la propia pantalla: sus dos
          acciones dependen de a cuántos hay convocados y de si ya se repartió. */}
      <Stack.Screen name="convocatoria" options={{ title: "Convocatoria" }} />
    </TabStack>
  );
}
