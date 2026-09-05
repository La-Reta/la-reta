import { ThemeToggle } from "@/components/app/theme-toggle";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "../../ui/button";
import { SidebarTrigger } from "../../ui/sidebar";
import { HeaderAuth } from "../header-auth";
import { RepositoryButton } from "../repository-button";
import { SidebarTitle } from "../sidebar-title";

export const AppSidebarHeader = () => {
  return (
    <header
      // Se saca del snapshot de la página para que no viaje con el slide: el
      // usuario necesita un punto fijo que le diga que cambió el contenido, no
      // la ventana entera. Reglas en globals.css (::view-transition-*).
      style={{ viewTransitionName: "app-header" }}
      className="bg-background/80 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md"
    >
      {/* El sr-only del primitivo está en inglés; el resto de la app es es-MX. */}
      <SidebarTrigger aria-label="Mostrar u ocultar el menú" />
      <Separator orientation="vertical" className="h-5" />
      <Button
        render={<Link href="/" />}
        variant="ghost"
        size="sm"
        className="-ml-1"
      >
        <SidebarTitle />
      </Button>
      <div className="ml-auto flex items-center gap-1.5">
        <HeaderAuth />
        <RepositoryButton />
        <ThemeToggle />
      </div>
    </header>
  );
};
