/*
 * El archivo se llama `utils.ts` y se queda así: `components.json` de shadcn
 * apunta a `@/lib/utils` y cada componente que genera `shadcn add` importa `cn`
 * de ahí. Renombrarlo rompería la generación y decenas de imports.
 */
/* eslint-disable-next-line unicorn/name-replacements -- lo exige shadcn */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
