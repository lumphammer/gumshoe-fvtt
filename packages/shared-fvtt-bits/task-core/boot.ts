import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { BootArgs, FoundryConfig, Manifest, TaskArgs } from "./types";

// logging function
export const log = console.log.bind(console, chalk.green("[task]"));

export async function boot({
  config: { rootPath, publicPath, manifestName, buildPath, packagePath },
  commands,
}: BootArgs) {
  process.chdir(rootPath);
  const manifestPath = path.join(publicPath, manifestName);
  const manifest = JSON.parse(
    (await fs.readFile(manifestPath)).toString(),
  ) as Manifest;

  let foundryConfig, linkDir;
  try {
    foundryConfig = (await fs.readJSON("foundryconfig.json")) as FoundryConfig;
    // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (e) {
    log(chalk.magenta("foundryconfig.json not found - assuming CI"));
  }
  if (foundryConfig?.dataPath) {
    const linkRoot = manifestName === "system.json" ? "systems" : "modules";
    linkDir = path.join(foundryConfig.dataPath, "Data", linkRoot, manifest.id);
  }

  const finalConfig: TaskArgs = {
    publicPath,
    manifestName,
    manifestPath,
    buildPath,
    linkDir,
    rootPath,
    manifest,
    packagePath,
    log,
    // synchronise,
  };

  const proc = yargs(hideBin(process.argv));

  for (const command of commands) {
    proc.command(
      command.name,
      command.description ?? "",
      () => {
        // no builder
      },
      () => {
        void command(finalConfig);
      },
    );
  }
  proc.completion();
  proc.demandCommand(1);
  proc.strict();
  await proc.parse();
}
