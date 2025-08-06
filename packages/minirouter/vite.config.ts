/// <reference types="vitest" />
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

// const name = "minirouter";

const config = defineConfig(({ mode }) => {
  return {
    root: "src/",
    publicDir: path.resolve(__dirname, "public"),

    test: {
      // fix "document is not defined"
      environment: "happy-dom",
      // equivalent to jest.setup.js
      setupFiles: ["../vitest.setup.js"],
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
    ],
  };
});

export default config;
