import { ThemeToggle } from "@/components/app/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { RepositoryButton } from "./repository-button";
import { SidebarTitle } from "./sidebar-title";

export function AppSidebarHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b px-3 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="!h-full" />
      <SidebarTitle />
      <div className="ml-auto flex items-center gap-2">
        <RepositoryButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
