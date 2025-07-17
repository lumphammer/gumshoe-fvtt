/// <reference types="vitest" />
import { defineConfig } from "vite";

import { createViteUserConfig } from "./packages/shared-fvtt-bits/dotfiles/import/createViteUserConfig";

// causes tsgo to crash
// import { id as foundryPackageId } from "./public/system.json";

const config = defineConfig(({ mode }) => {
  const userConfig = createViteUserConfig({
    mode,
    foundryPackageId: "investigator",
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
    // typecheck: {
    //   ...userConfig.test?.typecheck,
    //   enabled: false,
    // },
  };
  return userConfig;
});

export default config;
