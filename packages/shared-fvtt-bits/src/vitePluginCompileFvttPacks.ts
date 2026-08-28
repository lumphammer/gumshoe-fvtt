import { compilePack } from "@foundryvtt/foundryvtt-cli";
import chalk from "chalk";
import { existsSync, readFileSync, statSync } from "fs";
import { dirname, resolve } from "path";
import { readdir } from "fs/promises";
import { PluginOption } from "vite";

import { checkLocks } from "./checkLocks";

type vitePluginCompileFvttPacksOptions = {
  srcDir?: string;
  destDir?: string;
};

type PackManifest = {
  packs?: Array<{ name: string; path: string }>;
};

/**
 * Find the built package manifest sitting alongside the compiled packs. Systems
 * and modules use different file names, so we accept either.
 */
function findManifestPath(destDir: string) {
  const packageRoot = dirname(destDir);
  const manifestPath = ["system.json", "module.json"]
    .map((name) => resolve(packageRoot, name))
    .find((candidate) => existsSync(candidate));
  if (manifestPath === undefined) {
    throw new Error(
      `Could not find a system.json or module.json in ${packageRoot}`,
    );
  }
  return manifestPath;
}

export function validateManifestPackPaths(
  destDir: string,
  actualPackRoot = destDir,
) {
  const manifestPath = findManifestPath(destDir);
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as PackManifest;
  const missingPacks = (manifest.packs ?? []).filter(({ path }) => {
    const packPath = resolve(dirname(manifestPath), path);
    return !existsSync(packPath) || !statSync(packPath).isDirectory();
  });

  if (missingPacks.length > 0) {
    const details = missingPacks
      .map(({ name, path }) => `- ${name}: ${path}`)
      .join("\n");
    throw new Error(
      `The following compendium paths in ${manifestPath} do not resolve to LevelDB directories:\n${details}`,
    );
  }
}

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
}: vitePluginCompileFvttPacksOptions = {}): PluginOption {
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
        validateManifestPackPaths(destDir);
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
      validateManifestPackPaths(destDir);
      // list contents of destDir
      const contents = (await readdir(destDir))
        .map((f) => `${chalk.dim(`${destDir}/`)}${chalk.cyan(f)}`)
        .join("\n");
      console.log(contents);
      console.log(chalk.green("💽 FVTT pack databases built.\n"));
    },
  };
}
