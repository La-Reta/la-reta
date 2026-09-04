import config from "ultracite/prettier";

export default {
  ...config,
  // prettier-plugin-tailwindcss debe ir siempre al final.
  plugins: ["prettier-plugin-tailwindcss"],
  // Heredado de apps/la-reta-web/.prettierrc: ordena clases dentro de
  // estos helpers, no solo en className.
  tailwindFunctions: ["clsx", "classNames", "cva"],
};
