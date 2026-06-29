"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { liveMatchAtom } from "@/lib/state/atoms";
import { cn } from "@/lib/utils";
import { atom, useAtomValue } from "jotai";
import {
  ChevronRightIcon,
  CircleDotIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  LifeBuoyIcon,
  LockIcon,
  MapIcon,
  RadioIcon,
  ScaleIcon,
  ShieldHalfIcon,
  SparkleIcon,
  SparklesIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Badge } from "../ui/badge";
import { SidebarTitle } from "./sidebar-title";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
  hint?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Partido",
    items: [
      {
        title: "Resumen",
        href: "/",
        icon: LayoutDashboardIcon,
        hint: "Vista general",
      },
      {
        title: "En vivo",
        href: "/live",
        icon: RadioIcon,
        hint: "Marcador activo",
      },
      {
        title: "Partidos",
        href: "/matches",
        icon: TrophyIcon,
        hint: "Historial y resultados",
      },
    ],
  },
  {
    label: "Plantilla",
    items: [
      {
        title: "Jugadores",
        href: "/players",
        icon: UsersIcon,
        hint: "Roster completo",
      },
      {
        title: "Nuevo jugador",
        href: "/players/new",
        icon: UserPlusIcon,
        hint: "Alta rápida",
      },
      {
        title: "Posiciones",
        href: "/positions",
        icon: MapIcon,
        hint: "Mapa de cancha",
      },
      {
        title: "Armar equipos",
        href: "/teams",
        icon: ShieldHalfIcon,
        hint: "Balancear reta",
      },
    ],
  },
  {
    label: "Comunidad",
    items: [
      {
        title: "Ideas",
        href: "/ideas",
        icon: LightbulbIcon,
        hint: "Mejoras y propuestas",
      },
      {
        title: "Reportar",
        href: "/reportes",
        icon: LifeBuoyIcon,
        hint: "Ayuda y denuncias",
      },
      {
        title: "La Reta ___",
        href: "/palabras",
        icon: SparklesIcon,
        hint: "Dinámica social",
      },
    ],
  },
  {
    label: "Confianza",
    items: [
      {
        title: "Legal",
        href: "/legal",
        icon: ScaleIcon,
        hint: "Privacidad, términos e IA",
      },
    ],
  },
];

// "Administración" section in the nav: a single entry point for non-admins
// (the login lives at /admin), expanding to the admin pages once signed in.
const NON_ADMIN_ITEMS: NavItem[] = [
  {
    title: "Admin",
    href: "/admin",
    icon: LockIcon,
    hint: "Acceso de administrador",
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    title: "Panel",
    href: "/admin",
    icon: LockIcon,
    hint: "Tablero de control",
  },
  {
    title: "Reportes",
    href: "/admin/reportes",
    icon: LifeBuoyIcon,
    hint: "Bandeja de reportes",
  },
  {
    title: "Ideas",
    href: "/admin/ideas",
    icon: LightbulbIcon,
    hint: "Bandeja de ideas",
  },
];

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);
const liveMatchActiveAtom = atom((get) => get(liveMatchAtom).active);

const SidebarNavItem = React.memo(function SidebarNavItem({
  item,
  active,
  liveActive,
  showTooltip,
}: {
  item: NavItem;
  active: boolean;
  liveActive: boolean;
  showTooltip: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={showTooltip ? (item.hint ?? item.title) : undefined}
        render={<Link href={item.href} />}
        className={cn(
          "h-10 rounded-xl px-3 transition-all group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:rounded-2xl",
          "data-[active=true]:bg-sidebar-primary/12 data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--sidebar-primary)_28%,transparent)]",
          "hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
        )}
      >
        <item.icon className={cn(active && "text-sidebar-primary")} />
        <span>{item.title}</span>
        {item.href === "/live" && liveActive ? (
          <SidebarMenuBadge className="right-2 bg-emerald-500/14 text-emerald-600 group-data-[collapsible=icon]:hidden dark:text-emerald-400">
            Live
          </SidebarMenuBadge>
        ) : active ? (
          <ChevronRightIcon className="text-sidebar-primary ml-auto size-4 group-data-[collapsible=icon]:hidden" />
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

export function AppSidebar({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const liveActive = useAtomValue(liveMatchActiveAtom);
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const showTooltip = isCollapsed;

  const activeHref = React.useMemo(
    () =>
      [...ALL_NAV_ITEMS, ...(admin ? ADMIN_ITEMS : NON_ADMIN_ITEMS)].reduce<
        string | null
      >((bestHref, item) => {
        if (item.href === "/") {
          return pathname === "/" ? "/" : bestHref;
        }

        const matches =
          pathname === item.href || pathname.startsWith(item.href + "/");

        if (!matches) return bestHref;

        if (!bestHref || item.href.length > bestHref.length) {
          return item.href;
        }

        return bestHref;
      }, null),
    [pathname, admin],
  );

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="gap-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pt-3">
        <Link
          href="/"
          aria-label="Ir al resumen"
          className="border-sidebar-border/70 bg-sidebar/80 hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:border-sidebar-border/60 block rounded-2xl border p-3 shadow-sm transition-colors group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none"
        >
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/8 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:rounded-2xl">
              <Image
                src="/fifa-wc.webp"
                alt="Reta Credix · FIFA 26"
                width={1536}
                height={1024}
                priority
                className="h-7 w-auto"
              />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2">
                <SidebarTitle />
                <span className="bg-sidebar-accent text-sidebar-accent-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
                  FIFA 26
                </span>
              </div>
              <p className="text-sidebar-foreground/65 mt-1 text-[11px]">
                Navegación principal de la reta
              </p>
            </div>
          </div>
        </Link>

        <div className="border-sidebar-border/70 bg-sidebar-accent/45 rounded-xl border p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sidebar-foreground/55 text-[10px] font-semibold tracking-[0.16em] uppercase">
                Estado actual
              </p>
              {liveActive ? (
                <Link
                  href={"http://localhost:3000/live"}
                  className="text-sidebar-foreground mt-1 text-sm font-semibold"
                >
                  Partido en juego
                </Link>
              ) : (
                <p className="text-sidebar-foreground mt-1 text-sm font-semibold">
                  Sin partido activo
                </p>
              )}
            </div>
            <div
              className={
                liveActive
                  ? "flex items-center gap-1 rounded-full bg-emerald-500/14 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                  : "bg-sidebar text-sidebar-foreground/65 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
              }
            >
              <CircleDotIcon className="size-3.5" />
              {liveActive ? "Live" : "Idle"}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 group-data-[collapsible=icon]:px-1">
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup
            key={section.label}
            className="px-2 py-1 group-data-[collapsible=icon]:px-0"
          >
            {!isCollapsed ? (
              <SidebarGroupLabel className="text-sidebar-foreground/45 px-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                {section.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    active={item.href === activeHref}
                    liveActive={liveActive}
                    showTooltip={showTooltip}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="px-2 py-1 group-data-[collapsible=icon]:px-0">
          {!isCollapsed ? (
            <SidebarGroupLabel className="text-sidebar-foreground/45 px-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
              Administración
            </SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {(admin ? ADMIN_ITEMS : NON_ADMIN_ITEMS).map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  active={item.href === activeHref}
                  liveActive={liveActive}
                  showTooltip={showTooltip}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        <div className="border-sidebar-border/70 bg-sidebar-accent/35 rounded-xl border px-3 py-2 group-data-[collapsible=icon]:hidden">
          <div className="text-sidebar-foreground/72 flex items-center gap-2 text-[11px] font-medium">
            <SparkleIcon className="text-sidebar-primary size-3.5" />
            Stack actual
          </div>
          <p className="text-sidebar-foreground/58 mt-1 text-[11px]">
            Neon, Drizzle y tiempo real para la reta.
          </p>
          <Badge variant={"outline"}>Beta v1.0.0</Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
