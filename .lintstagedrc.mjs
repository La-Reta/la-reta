// lint-staged pasa rutas explícitas al comando, lo que sortea tanto
// .prettierignore como el campo `ignores` de eslint.config.mjs. Por eso el
// filtrado tiene que repetirse aquí.
const quote = (files) => files.map((file) => `'${file}'`).join(" ");

// Upstream de Clerk, Neon y Vercel. Reformatearlas invalidaría los
// computedHash de skills-lock.json.
const isVendored = (file) =>
  /\/\.agents\//.test(file) || /\/\.claude\/skills\//.test(file);

// La app Expo está fuera del ESLint de Ultracite (no hay preset de React
// Native). Sin este filtro, `ultracite fix` le aplica autofixes agresivos:
// llegó a borrar un <HintRow> y su helper por considerarlos sin uso.
// Formatear sí, reescribir no.
const isExpoApp = (file) => /\/apps\/la-reta-app\//.test(file);

export default {
  "*.{js,jsx,ts,tsx,json,jsonc,css,scss,md,mdx}": (files) => {
    const own = files.filter((file) => !isVendored(file));
    const linted = own.filter((file) => !isExpoApp(file));
    const formattedOnly = own.filter(isExpoApp);

    const tasks = [];
    if (linted.length) {
      tasks.push(`npx ultracite fix ${quote(linted)}`);
    }
    if (formattedOnly.length) {
      tasks.push(`npx prettier --write ${quote(formattedOnly)}`);
    }
    return tasks;
  },
};
