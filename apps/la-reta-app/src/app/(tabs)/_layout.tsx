import AppTabs from "@/components/app-tabs";

/**
 * El componente resuelve por plataforma: `app-tabs.tsx` en iOS y Android, y
 * `app-tabs.web.tsx` en el navegador, donde `NativeTabs` no existe.
 */
export default function TabsLayout() {
  return <AppTabs />;
}
