// lint-staged pasa rutas explícitas, lo que sortea los ficheros de ignore.
// Las skills vendorizadas (.agents/, .claude/skills/) son contenido upstream:
// reformatearlas invalidaría los computedHash de skills-lock.json.
const isVendored = (file) =>
  /\/\.agents\//.test(file) || /\/\.claude\/skills\//.test(file);

export default {
  "*.{js,jsx,ts,tsx,json,jsonc,css,scss,md,mdx}": (files) => {
    const own = files.filter((file) => !isVendored(file));
    return own.length ? [`npx ultracite fix ${own.map((f) => `'${f}'`).join(" ")}`] : [];
  },
};
