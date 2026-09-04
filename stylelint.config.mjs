import config from "ultracite/stylelint";

export default {
  ...config,
  rules: {
    ...config.rules,
    // Ultracite ya ignora las at-rules de Tailwind 3, pero no las de
    // Tailwind 4, que es lo que usan ambas apps (@theme, @custom-variant).
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          ...config.rules["at-rule-no-unknown"][1].ignoreAtRules,
          "theme",
          "custom-variant",
          "utility",
          "variant",
          "plugin",
          "config",
        ],
      },
    ],
    // stylelint-config-standard no sabe leer el prelude de @apply
    // ("border-border outline-ring/50") y lo marca como inválido.
    "at-rule-prelude-no-invalid": null,
  },
  overrides: [
    {
      // CSS Modules expone las clases como propiedades JS, por lo que la
      // convención es camelCase, no el kebab-case que exige el estándar.
      files: ["**/*.module.css"],
      rules: { "selector-class-pattern": null },
    },
  ],
};
