# Components Architecture

Esta carpeta sigue una estructura pensada para App Router, colaboración en equipo y crecimiento gradual del proyecto.

## Estructura

`components/ui/`

- Primitivos de UI basados en `shadcn/ui` y `@base-ui`.
- No deben contener lógica de dominio.

`components/app/`

- Shell global de la aplicación.
- Navegación, providers, theming y piezas que viven a nivel layout.

`components/shared/`

- Componentes reutilizables en más de un dominio.
- Deben seguir siendo agnósticos al feature cuando sea posible.

`components/features/<feature>/`

- Componentes de dominio agrupados por feature.
- Ejemplos actuales: `players`, `matches`, `live`, `ideas`, `teams`, `admin`.

## Reglas

1. Si un componente solo sirve a un dominio, va en `components/features/<feature>/`.
2. Si un componente se usa en varias áreas del producto, va en `components/shared/`.
3. Si un componente compone la estructura global de la app, va en `components/app/`.
4. Los primitivos visuales y wrappers de librerías van en `components/ui/`.
5. Evita crear nuevos archivos en el root de `components/`.

## Convención con Next.js

Para UI estrictamente local a una ruta o segmento, la recomendación de Next.js es preferir colocation dentro de:

`app/<segment>/_components/`

Eso ayuda cuando una pieza:

- no se reutiliza fuera de una ruta,
- depende fuertemente del contexto del segmento,
- o crecerá junto con esa pantalla.

## Convención de imports

Usamos imports absolutos por carpeta de responsabilidad:

```ts
import { AppShell } from "@/components/app/app-shell";
import { FifaCard } from "@/components/shared/fifa-card";
import { PlayerForm } from "@/components/features/players/player-form";
import { Button } from "@/components/ui/button";
```

## Qué evitar

- Carpetas genéricas como `misc`, `common2`, `helpers-ui`.
- Barrel files globales para toda la carpeta `components/`.
- Mezclar lógica de dominio dentro de `components/ui/`.
- Colocar componentes nuevos en `components/` root sin una razón clara.
