import { Stack } from "expo-router";

import { TabStack } from "@/components/tab-stack";

export default function PlantillaLayout() {
  return (
    <TabStack>
      <Stack.Screen name="plantilla" options={{ title: "Plantilla" }} />
      {/* Compartida entre pestañas; el título lo pone la propia ficha. */}
      <Stack.Screen name="jugador/[id]" />
      <Stack.Screen name="partido/[id]" />

      {/* Hoja nativa, como el calendario: la presenta iOS con su arrastre y su
          cierre por gesto.

          Sin cabecera: dentro de una hoja `fitToContents`, la barra de título
          entraba en la medición y el resultado no cuadraba con lo dibujado —la
          primera fila se quedaba tapada y sobraba hueco abajo—. El título va
          dentro del contenido, que además es lo que hacen las hojas del
          sistema. */}
      <Stack.Screen
        name="orden"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetGrabberVisible: true,
        }}
      />
    </TabStack>
  );
}
