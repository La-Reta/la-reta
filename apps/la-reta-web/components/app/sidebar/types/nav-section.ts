import type { ComponentProps, ComponentType } from "react";

export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<ComponentProps<"svg">>;
  hint?: string;
  onlyAdmin?: boolean;
  subItems?: NavItem[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
