// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // eslint-config-expo deja la detección de versión de React en "detect",
    // que bajo ESLint 10 llama al context.getFilename() ya eliminado y
    // rompe toda regla version-aware de eslint-plugin-react. Fijarla lo
    // evita; es el mismo workaround que aplica el preset de Ultracite.
    settings: { react: { version: "19.2.3" } },
  },
  {
    ignores: ["dist/*"],
  },
]);
