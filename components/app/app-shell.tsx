import { AppSidebar } from "@/components/app/app-sidebar";
import { LegalConsentGate } from "@/components/features/legal/legal-consent-alert";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebarHeader } from "./app-sidebar-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppSidebarHeader />
        <main className="flex-1 p-4 md:p-6">
          <LegalConsentGate>{children}</LegalConsentGate>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
