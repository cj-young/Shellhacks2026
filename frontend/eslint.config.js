//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";
import prettierConfig from "eslint-config-prettier";

export default [
  ...tanstackConfig,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
    },
  },
  prettierConfig,
  {
    ignores: ["eslint.config.js", "prettier.config.js"],
  },
];
