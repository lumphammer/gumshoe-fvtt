import "./declarations.js";

import { extractPack } from "@foundryvtt/foundryvtt-cli";
import chalk from "chalk";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import prettier from "prettier";

import { checkLocks } from "../../src/checkLocks";
import { TaskArgs } from "../types";

function transformName(doc: {
  name: string;
  _key: string;
  _id: string;
  type: string;
}) {
  const safeFileName = doc.name.replace(/[^a-zA-Z0-9А-я]/g, "_");
  const type = doc._key.split("!")[1];
  const prefix = ["actors", "items"].includes(type) ? doc.type : type;

  return `${doc.name ? `${prefix}_${safeFileName}_${doc._id}` : doc._id}.yml`;
}

/**
 * Extracts all FVTT pack databases from `./build/packs` into `./src/packs`.
 */
export async function extractPacks({ buildPath, log, publicPath }: TaskArgs) {
  const packs = await readdir("./build/packs");

  // checklocks no longer seems to work in v13 but the extract operation
  // errors out if there are open locks.
  const locks = await checkLocks("./build/packs");
  if (locks) {
    console.error(
      chalk.red(
        `\nERROR: The following packs are open in another process:\n${locks}\n`,
      ),
    );
    process.exit(1);
  }

  console.log(chalk.green("All packs checked\n"));

  await rm("./src/packs", { recursive: true, force: true });
  await mkdir("./src/packs", { recursive: true });

  await Promise.all(
    packs.map(async (pack) => {
      console.log(chalk.blue(`Extracting ${pack}`));
      const destDir = `./src/packs/${pack}`;
      try {
        await extractPack(`./build/packs/${pack}`, destDir, {
          yaml: true,
          transformName,
          yamlOptions: {
            quotingType: '"',
          },
        });
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(
          chalk.red(`\nERROR: Failed to extract ${pack}: ${errorMessage}\n`),
        );
        console.error(
          chalk.red(
            "This may be because your game world is open in Foundry.\n",
          ),
        );
        process.exit(1);
      }
      const files = await readdir(destDir);
      await Promise.all(
        files.map(async (file) => {
          const content = await readFile(`${destDir}/${file}`, "utf8");
          const formatted = await prettier.format(content, { parser: "yaml" });
          await writeFile(`${destDir}/${file}`, formatted);
        }),
      );
    }),
  );

  console.log(chalk.green("All packs extracted\n"));
}
