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
    // Produces Vercel's Build Output API layout when deployed there.
    nitro({ preset: "vercel" }),
    viteReact(),
  ],
});

export default config;
