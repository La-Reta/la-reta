import { AppSidebar } from "@/components/app/app-sidebar";
import { LegalConsentGate } from "@/components/features/legal/legal-consent-alert";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isAdmin } from "@/lib/admin";

import { AppSidebarHeader } from "./app-sidebar-header";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <SidebarProvider>
      <AppSidebar admin={admin} />
      {/* min-w-0: deja que el inset encoja junto al sidebar acoplado; sin esto,
          contenido ancho fuerza scroll horizontal en tablet. */}
      <SidebarInset className="min-w-0">
        <AppSidebarHeader />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <LegalConsentGate>{children}</LegalConsentGate>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
