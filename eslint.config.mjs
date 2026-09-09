import * as tsParser from "@typescript-eslint/parser";
import core from "ultracite/eslint/core";
import next from "ultracite/eslint/next";
import react from "ultracite/eslint/react";

export default [
  // apps/la-reta-app se lintea con `expo lint` (eslint-config-expo).
  // Ultracite no tiene preset de React Native, y su core carga
  // eslint-plugin-compat / -n / -html, que asumen navegador o Node y
  // producirían falsos positivos sobre código RN.
  {
    ignores: [
      "apps/la-reta-app/**",
      // Skills vendorizadas (upstream de Clerk, Neon y Vercel): no son
      // código nuestro y no las cubre ningún tsconfig.
      ".agents/**",
      ".claude/skills/**",
      "**/*.json",
      "**/*.jsonc",
    ],
  },

  ...core,
  ...react,
  ...next,

  // Dos ajustes sobre el core de Ultracite, que asume un proyecto único:
  //  1. Solo asigna el parser de TypeScript a **/*.ts, así que los .tsx
  //     se parseaban como JS y toda su sintaxis de tipos fallaba.
  //  2. Fija parserOptions.project = "./tsconfig.json", que aquí no existe
  //     porque cada workspace tiene el suyo. projectService descubre el
  //     tsconfig más cercano a cada archivo, que es lo correcto en monorepo.
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Ultracite es opinionado en estilo, y varias de sus reglas contradicen
  // las convenciones que este repo ya usa en todo lib/ y app/actions/.
  // Se apagan las estéticas y se conservan las de fondo (tipos, promesas,
  // a11y, seguridad).
  {
    rules: {
      // El código existente declara todo con `export async function`.
      "func-style": "off",
      // Constantes en SCREAMING_CASE: ADMIN_COOKIE, TEAM_KEYS, VOTE_CATEGORY_KEYS.
      "@typescript-eslint/naming-convention": "off",
      // Ordenar alfabéticamente cada objeto literal esconde el agrupamiento
      // lógico de los payloads de Drizzle.
      "sort-keys": "off",
      // Obligaría a renombrar helpers ya establecidos.
      "unicorn/consistent-boolean-name": "off",
      // Necesario para comparaciones en tiempo constante.
      "no-bitwise": "off",
      // `x == null` (null o undefined a la vez) es el idiom del repo.
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-eq-null": "off",
      // Buffer es el idiom de Node en este repo; Uint8Array.toBase64/fromBase64
      // son de ES2025 y aún no están en todos los runtimes de despliegue.
      "unicorn/prefer-uint8array-base64": "off",
    },
  },

  // eslint-plugin-compat comprueba compatibilidad de APIs de navegador. En el
  // código de servidor (route handlers, servicios, lib/) marca falsos
  // positivos sobre APIs de Node perfectamente válidas.
  {
    files: [
      "apps/*/app/api/**",
      "apps/*/lib/**",
      "apps/*/app/actions/**",
      "apps/*/drizzle.config.ts",
    ],
    rules: { "compat/compat": "off" },
  },
  // `components/ui/**` son primitivas generadas por shadcn. Tres reglas chocan
  // con su diseño, y no con un descuido nuestro:
  //
  //  - `prefer-tag-over-role`: shadcn usa `role="group"` en Field, InputGroup y
  //    ButtonGroup. Es ARIA válido; cambiarlo por `<fieldset>` arrastra estilos
  //    de agente de usuario y rompe la maquetación.
  //  - `only-export-components`: exportar el componente **y** sus `cva` variants
  //    (`buttonVariants`, `badgeVariants`) desde el mismo archivo es su API, y
  //    media app importa de ahí.
  //  - `react-compiler-no-manual-memoization`: el compilador de React no está
  //    activado en este proyecto, así que sus `useMemo`/`useCallback` sí hacen
  //    trabajo. Quitarlos es una regresión de rendimiento, no una limpieza.
  //
  // Va acotado aquí y no como `eslint-disable` dentro de los archivos porque
  // `shadcn add` los reescribe: los comentarios se perderían y volveríamos a
  // empezar. Lo que sí es un fallo de verdad —a11y real, claves de lista,
  // `==`— está arreglado en el propio archivo.
  {
    files: ["apps/*/components/ui/**"],
    rules: {
      "jsx-a11y/prefer-tag-over-role": "off",
      "react-doctor/only-export-components": "off",
      "react-doctor/react-compiler-no-manual-memoization": "off",
      // `react-day-picker` recibe los subcomponentes por la prop `components`:
      // definirlos ahí es su API, no un descuido.
      "react/no-unstable-nested-components": "off",
      // Falso positivo en TypeScript: los tipos ya validan las props.
      "react/prop-types": "off",
      // Limitación interna del compilador de React con `String.raw`, no un
      // problema del código.
      "react-hooks/todo": "off",
      // `chart.tsx` inyecta las variables CSS del tema por `style`; es el
      // mecanismo de shadcn y el contenido no viene de fuera.
      "react/no-danger": "off",
      // recharts se importa estático a propósito: los componentes que lo usan
      // ya son cliente y solo se montan en las vistas que llevan gráfica.
      "react-doctor/prefer-dynamic-import": "off",
      // `FieldLabel` y `Label` son envoltorios: el `htmlFor` lo pone quien los
      // usa, y ahí sí se comprueba. Igual el `<a>` de `PaginationLink`, que
      // recibe su contenido por la prop `render` del Button.
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/anchor-has-content": "off",
    },
  },
];
