import {
  FileChartColumnIncreasingIcon,
  FileUserIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  LightbulbIcon,
  MapIcon,
  RadioIcon,
  ScaleIcon,
  ShieldHalfIcon,
  ShirtIcon,
  SparklesIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { NavSection } from "../types/nav-section";

export const NAV_SECTIONS: NavSection[] = [
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
        subItems: [
          {
            title: "Registar jugador",
            href: "/players/registro",
            icon: FileUserIcon,
            hint: "Formulario de registro",
          },
          {
            title: "Nuevo jugador",
            href: "/players/new",
            icon: UserPlusIcon,
            hint: "Alta rápida",
            onlyAdmin: true,
          },
        ],
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
        subItems: [
          {
            title: "Registros de equipos",
            href: "/teams/registro",
            icon: FileChartColumnIncreasingIcon,
            hint: "Historial de equipos",
          },
        ],
      },
      {
        title: "Casacas",
        href: "/casacas",
        icon: ShirtIcon,
        hint: "Ruleta de lavado",
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
        title: "La Reta ___",
        href: "/palabras",
        icon: SparklesIcon,
        hint: "Dinámica social",
      },
      {
        title: "Reportar",
        href: "/reportes",
        icon: LifeBuoyIcon,
        hint: "Ayuda y denuncias",
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
