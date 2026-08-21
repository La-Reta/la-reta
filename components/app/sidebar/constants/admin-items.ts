import {
  FileUserIcon,
  LifeBuoyIcon,
  LightbulbIcon,
  LockIcon,
} from "lucide-react";
import { NavItem } from "../types/nav-section";

export const ADMIN_ITEMS: NavItem[] = [
  {
    title: "Panel",
    href: "/admin",
    icon: LockIcon,
    hint: "Tablero de control",
    subItems: [
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
      {
        title: "Registros",
        href: "/admin/registros",
        icon: FileUserIcon,
        hint: "Bandeja de registros",
      },
    ],
  },
];
