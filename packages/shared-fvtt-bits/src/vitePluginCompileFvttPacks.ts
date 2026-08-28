import { compilePack } from "@foundryvtt/foundryvtt-cli";
import chalk from "chalk";
import { existsSync, readFileSync, statSync } from "fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "path";
import { mkdir, mkdtemp, readdir, rename, rm } from "fs/promises";
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
    const manifestPackPath = resolve(dirname(manifestPath), path);
    const relativePackPath = relative(resolve(destDir), manifestPackPath);
    const escapesDestination =
      isAbsolute(relativePackPath) ||
      relativePackPath === ".." ||
      relativePackPath.startsWith(`..${sep}`);
    const packPath = resolve(actualPackRoot, relativePackPath);
    return (
      escapesDestination ||
      !existsSync(packPath) ||
      !statSync(packPath).isDirectory()
    );
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

async function replacePackDirectory(stagingDir: string, destDir: string) {
  const backupDir = `${stagingDir}-previous`;
  const destinationExists = existsSync(destDir);
  if (destinationExists) {
    await rename(destDir, backupDir);
  }
  try {
    await rename(stagingDir, destDir);
  } catch (error) {
    if (destinationExists && existsSync(backupDir)) {
      await rename(backupDir, destDir);
    }
    throw error;
  }
  if (destinationExists) {
    await rm(backupDir, { force: true, recursive: true });
  }
}

async function compilePacks(srcDir: string, destDir: string, packs: string[]) {
  const resolvedDestDir = resolve(destDir);
  await mkdir(dirname(resolvedDestDir), { recursive: true });
  const stagingDir = await mkdtemp(
    resolve(dirname(resolvedDestDir), `.${basename(resolvedDestDir)}-staging-`),
  );
  let promoted = false;
  try {
    for (const pack of packs) {
      await compilePack(resolve(srcDir, pack), resolve(stagingDir, pack), {
        yaml: true,
      });
    }
    validateManifestPackPaths(resolvedDestDir, stagingDir);
    await replacePackDirectory(stagingDir, resolvedDestDir);
    promoted = true;
  } finally {
    if (!promoted) {
      await rm(stagingDir, { force: true, recursive: true });
    }
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
  let failOnLockedPacks = true;
  return {
    name: "compile-fvtt-packs",

    // don't do this when launching dev server, it would be annoying
    apply: "build",

    configResolved(config) {
      failOnLockedPacks = !["dev", "development"].includes(config.mode);
    },

    async closeBundle() {
      console.log(chalk.blue("\nChecking for open FVTT pack databases..."));
      const locks = await checkLocks(destDir);
      if (locks) {
        const message =
          "The following FVTT pack databases are open in another process " +
          `(probably your FVTT world is open):\n${locks}`;
        console.log(
          chalk.red(`\n${message.split("\n")[0]}\n`, `${chalk.dim(locks)}\n`),
        );
        let validationError: Error | undefined;
        try {
          validateManifestPackPaths(destDir);
        } catch (error) {
          validationError =
            error instanceof Error ? error : new Error(String(error));
        }
        if (failOnLockedPacks) {
          throw new Error(message, { cause: validationError });
        }
        if (validationError !== undefined) {
          throw validationError;
        }
        return;
      } else {
        console.log(chalk.green("👌 no open FVTT pack databases found.\n"));
      }

      // If srcDir doesn't exist or is empty, don't compile packs.
      if (!existsSync(srcDir) || (await readdir(srcDir)).length === 0) {
        validateManifestPackPaths(destDir);
        console.log(chalk.cyan(`No packs found in ${srcDir}`));
        return;
      }

      console.log(chalk.blue(`Building FVTT pack databases to ${destDir}...`));
      const packs = (await readdir(srcDir)).filter(
        (pack) => pack !== ".gitattributes",
      );
      await compilePacks(srcDir, destDir, packs);
      // list contents of destDir
      const contents = (await readdir(destDir))
        .map((f) => `${chalk.dim(`${destDir}/`)}${chalk.cyan(f)}`)
        .join("\n");
      console.log(contents);
      console.log(chalk.green("💽 FVTT pack databases built.\n"));
    },
  };
}
