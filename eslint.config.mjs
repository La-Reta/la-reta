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
];
