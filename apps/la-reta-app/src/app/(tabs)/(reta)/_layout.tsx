import { Stack } from "expo-router";

import { TabStack } from "@/components/tab-stack";

export default function RetaLayout() {
  return (
    <TabStack>
      <Stack.Screen name="reta" options={{ title: "Armar reta" }} />
    </TabStack>
  );
}
