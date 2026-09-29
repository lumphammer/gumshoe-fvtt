import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import type { TaskArgs } from "../types";

/**
 * Link build to foundrydata
 */
export async function link({ buildPath, linkDir, log }: TaskArgs) {
  if (!linkDir) {
    throw new Error("linkDir not set");
  }
  if (!fs.existsSync(linkDir)) {
    log(
      `Linking ${chalk.blueBright(buildPath)} to ${chalk.blueBright(linkDir)}`,
    );
    return fs.symlink(path.resolve(buildPath), linkDir);
  } else {
    log(chalk.magenta(`${chalk.blueBright(linkDir)} already exists`));
  }
}

link.description = "Link build to foundrydata";
