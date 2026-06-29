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
      <SidebarInset>
        <AppSidebarHeader />
        <main className="flex-1 p-4 md:p-6">
          <LegalConsentGate>{children}</LegalConsentGate>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
