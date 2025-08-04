/// <reference types="vitest" />
import react from "@vitejs/plugin-react-swc";
import path from "path";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

const name = "minirouter";

const config = defineConfig(({ mode }) => {
  console.log(mode);
  return {
    root: "src/",
    publicDir: path.resolve(__dirname, "public"),

    test: {
      // fix "document is not defined"
      environment: "happy-dom",
      // equivalent to jest.setup.js
      setupFiles: ["../vitest.setup.js"],
    },

    build: {
      outDir: path.resolve(__dirname, "build"),
      emptyOutDir: true,
      sourcemap: mode !== "production",
      minify: mode === "production",
      lib: {
        name,
        entry: "index.ts",
        formats: ["es"],
        fileName: name,
      },
    },

    plugins: [
      react({
        jsxImportSource: "@emotion/react",
        plugins: [
          [
            "@swc/plugin-emotion",
            {
              autoLabel: "always",
            },
          ],
        ],
      }),
      peerDepsExternal(),
      visualizer({
        gzipSize: true,
        template: "treemap",
        filename: "stats/treemap.html",
      }),
    ],
  };
});

export default config;
