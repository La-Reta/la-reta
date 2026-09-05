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
  useSidebar,
} from "@/components/ui/sidebar";
import { liveMatchAtom } from "@/lib/state/atoms";
import { atom, useAtomValue } from "jotai";
import { CircleDotIcon, SparkleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Badge } from "../../ui/badge";
import { ADMIN_ITEMS } from "./constants/admin-items";
import { NAV_SECTIONS } from "./constants/nav-sections";
import { NON_ADMIN_ITEMS } from "./constants/non-admin-items";
import { SidebarLogo } from "./sidebar-logo";
import { SidebarNavItem } from "./sidebar-nav-item";

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);
const liveMatchActiveAtom = atom((get) => get(liveMatchAtom).active);

export const AppSidebar = ({ admin }: { readonly admin: boolean }) => {
  const pathname = usePathname();
  const liveActive = useAtomValue(liveMatchActiveAtom);
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const showTooltip = isCollapsed;

  // El React Compiler no está activado en este proyecto (no hay `reactCompiler`
  // en next.config.ts), así que este useMemo sí evita recorrer todos los items
  // de navegación en cada render.
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization
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
    [pathname, admin]
  );

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      // Igual que el header: queda fijo mientras el contenido se desliza.
      style={{ viewTransitionName: "app-sidebar" }}
    >
      <SidebarHeader className="gap-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pt-3">
        <SidebarLogo />

        <div className="border-sidebar-border/70 bg-sidebar-accent/45 rounded-xl border p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sidebar-foreground/55 text-xs font-semibold tracking-[0.16em] uppercase">
                Estado actual
              </p>
              {liveActive ? (
                <Link
                  href="/live"
                  className="text-sidebar-foreground hover:text-sidebar-primary focus-visible:ring-sidebar-ring mt-1 inline-block rounded-sm text-sm font-semibold underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none"
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
                  ? "flex items-center gap-1 rounded-full bg-emerald-500/14 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                  : "bg-sidebar text-sidebar-foreground/65 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
              }
            >
              <CircleDotIcon
                className={
                  liveActive ? "size-3.5 motion-safe:animate-pulse" : "size-3.5"
                }
                aria-hidden="true"
              />
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
              <SidebarGroupLabel className="text-sidebar-foreground/45 px-2 text-xs font-semibold tracking-[0.14em] uppercase">
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
                    admin={admin}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="px-2 py-1 group-data-[collapsible=icon]:px-0">
          {!isCollapsed ? (
            <SidebarGroupLabel className="text-sidebar-foreground/45 px-2 text-xs font-semibold tracking-[0.14em] uppercase">
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
                  admin={admin}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        <Badge
          variant="outline"
          className="group-data-[collapsible=icon]:hidden"
        >
          <SparkleIcon className="text-sidebar-primary size-3.5" /> Beta v1.1.0
        </Badge>
      </SidebarFooter>
    </Sidebar>
  );
};
