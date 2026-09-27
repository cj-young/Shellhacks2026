import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: { allowedHosts: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    // Vercel sets VERCEL=1 while building; force the Vercel preset there so the
    // output lands in `.vercel/output`. Forcing it everywhere would run Nitro's
    // Vercel env-runner locally, which warns about a missing VERCEL_OIDC_TOKEN.
    nitro(process.env.VERCEL ? { preset: "vercel" } : {}),
    viteReact(),
  ],
});

export default config;
