import chalk from "chalk";
import fs from "fs-extra";

import type { TaskArgs } from "../types";

/**
 * Remove the link to foundrydata
 */
export async function unlink({ linkDir, log }: TaskArgs) {
  if (!linkDir) {
    throw new Error("linkDir not set");
  }
  log(chalk.yellow(`Removing build link from ${chalk.blueBright(linkDir)}`));
  return fs.remove(linkDir);
}

unlink.description = "Remove the link to foundrydata";
