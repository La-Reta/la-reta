import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { NavItem } from "./types/nav-section";

export const SidebarNavItem = React.memo(function SidebarNavItem({
  item,
  active,
  liveActive,
  showTooltip,
  admin,
}: {
  item: NavItem;
  active: boolean;
  liveActive: boolean;
  showTooltip: boolean;
  admin: boolean;
}) {
  const pathname = usePathname();

  if (item.onlyAdmin && !admin) {
    return null;
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={showTooltip ? item.title : undefined}
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
      {item.subItems?.length ? (
        <SidebarMenuSub>
          {item.subItems?.map((subItem) => {
            if (subItem.onlyAdmin && !admin) {
              return null;
            }

            return (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  isActive={pathname === subItem.href}
                  render={<Link href={subItem.href} />}
                >
                  {subItem.icon && (
                    <subItem.icon
                      className={cn(
                        pathname === subItem.href && "text-sidebar-primary",
                      )}
                    />
                  )}
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
});
