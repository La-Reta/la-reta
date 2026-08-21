// "Administración" section in the nav: a single entry point for non-admins

import { LockIcon } from "lucide-react";
import { NavItem } from "../types/nav-section";

// (the login lives at /admin), expanding to the admin pages once signed in.
export const NON_ADMIN_ITEMS: NavItem[] = [
  {
    title: "Admin",
    href: "/admin",
    icon: LockIcon,
    hint: "Acceso de administrador",
  },
];
