import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // O site é export estático com images.unoptimized: next/image não otimiza
      // nada aqui e ainda embute JS extra. As imagens já são normalizadas no
      // upload do painel (ver MEDIDAS em public/admin/index.html).
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
