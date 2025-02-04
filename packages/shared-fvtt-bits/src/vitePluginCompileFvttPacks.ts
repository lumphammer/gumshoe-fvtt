import { compilePack } from "@foundryvtt/foundryvtt-cli";
import chalk from "chalk";
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

    // at start: kick off the build (into a temp folder)
    async buildStart(options) {
      console.log(chalk.blue("\nChecking for open FVTT pack databases..."));
      const locks = await checkLocks(destDir);
      if (locks) {
        console.error(
          `\nERROR: the following FVTT pack databases are open in another process:\n${locks}\n`,
        );
        process.exit(1);
      } else {
        console.log(chalk.green("👌 no open FVTT pack databases found.\n"));
      }
    },

    async closeBundle() {
      console.log(
        chalk.blue(`\nBuilding FVTT pack databases to ${destDir}...`),
      );
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
