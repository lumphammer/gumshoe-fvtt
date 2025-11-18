/// <reference types="vitest" />
import { defineConfig } from "vite";

import { name } from "./package.json";
// see https://vite.dev/config/#configuring-vite
// loading from the package `@lumphammer/shared-fvtt-bits` is possible but
// requires extra config and breaks vitest
import { createViteUserConfig } from "./packages/shared-fvtt-bits/dotfiles/import/createViteUserConfig";
import { id as foundryPackageId } from "./public/system.json";

const config = defineConfig(({ mode }) => {
  const userConfig = createViteUserConfig({
    mode,
    foundryPackageId,
    packageType: "system",
    importMetaUrl: import.meta.url,
  });
  // typechecking with tsgo in vitest is problematique rn - I can't get vitest
  // to find tests by setting .checker to the path to the executable. I've tried
  // `tsgo`, `./node_modules/.bin/tsgo`, anmd `../node_modules/.bin/tsgo`
  // (accounting for root dir being `src`.) I'd rather keep everything on the
  // same checker so I can use `@ts-expect-error` in places where tsgo has
  // issues and be alerted when they're fixed.
  userConfig.test = {
    ...userConfig.test,

    // uncomment this to disable type checks
    // currently seeing circularities under vitest typechecks 2025-11-17
    typecheck: {
      ...userConfig.test?.typecheck,
      enabled: false,
    },

    // paths are relative to `root` in the main `vite.config.ts`
    projects: [
      {
        extends: "../vite.config.ts",
        test: { name },
      },
      "../packages/*",
    ],
  };
  return userConfig;
});

export default config;
