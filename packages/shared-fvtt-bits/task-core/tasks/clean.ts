import { rimraf } from "rimraf";

import type { TaskArgs } from "../types";

/**
 * Remove built files from `build` folder
 * while ignoring source files
 */
export async function clean({ buildPath, log }: TaskArgs) {
  log(`Cleaning "${buildPath}"...`);
  await rimraf(buildPath);
  log("Finished cleaning.");
}

clean.description = "Remove built files from `build` folder";
