/// <reference types="vitest" />
import { defineConfig } from "vite";

import { createViteUserConfig } from "./createViteUserConfig";
import type { CreateFvttViteConfigArgs } from "./types";

export function createFvttViteConfig(args: CreateFvttViteConfigArgs) {
  const config = defineConfig(({ mode }) => {
    const userConfig = createViteUserConfig({ ...args, mode });
    // console.log("USER CONFIG", JSON.stringify(userConfig, null, 2));
    return userConfig;
  });

  return config;
}
