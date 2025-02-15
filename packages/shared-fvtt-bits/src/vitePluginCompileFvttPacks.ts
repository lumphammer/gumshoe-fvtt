import { compilePack } from "@foundryvtt/foundryvtt-cli";
import chalk from "chalk";
import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { Plugin } from "vite";

import { checkLocks } from "./checkLocks";

type vitePluginCompileFvttPacksOptions = {
  srcDir?: string;
  destDir?: string;
};

/**
 * This plugin will compile your compendium packs from YAMLs in `./src/packs`
 * into binary dbs in `./build/packs` (default paths can be overridden).
 *
 * It will check FVTT pack databases are open (implying that FVTT is using them)
 * and error out if it finds any.
 */
export function vitePluginCompileFvttPacks({
  srcDir = "./src/packs",
  destDir = "./build/packs",
}: vitePluginCompileFvttPacksOptions = {}): Plugin {
  return {
    name: "compile-fvtt-packs",

    // don't do this when launching dev server, it would be annoying
    apply: "build",

    async closeBundle() {
      console.log(chalk.blue("\nChecking for open FVTT pack databases..."));
      const locks = await checkLocks(destDir);
      if (locks) {
        console.log(
          chalk.red(
            "\nThe following FVTT pack databases are open in another process (probably your FVTT world is open):\n",
            `${chalk.dim(locks)}\n`,
          ),
        );
        return;
      } else {
        console.log(chalk.green("👌 no open FVTT pack databases found.\n"));
      }

      // id srcDir doesn't exist or is empty, don't compile packs
      if (!existsSync(srcDir) || (await readdir(srcDir)).length === 0) {
        console.log(chalk.cyan(`No packs found in ${srcDir}`));
        return;
      }

      console.log(chalk.blue(`Building FVTT pack databases to ${destDir}...`));
      const packs = await readdir(srcDir);
      for (const pack of packs) {
        if (pack === ".gitattributes") continue;
        await compilePack(`${srcDir}/${pack}`, `${destDir}/${pack}`, {
          yaml: true,
        });
      }
      // list contents of destDir
      const contents = (await readdir(destDir))
        .map((f) => `${chalk.dim(`${destDir}/`)}${chalk.cyan(f)}`)
        .join("\n");
      console.log(contents);
      console.log(chalk.green("💽 FVTT pack databases built.\n"));
    },
  };
}
