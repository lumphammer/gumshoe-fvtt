import { existsSync } from "fs";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import { load } from "js-yaml";
import path from "path";

import type { Manifest } from "../types";
import {
  babeleFileName,
  buildBabeleSource,
  buildIdIndex,
  diffEntries,
  findRenames,
  ID_INDEX_FILE_NAME,
  MAPPINGS_FILE_NAME,
  mappingsMatch,
  serializeJson,
  translatablePacks,
  updateTranslationText,
} from "./babeleFiles";
import type {
  BabeleFile,
  IdIndex,
  PackDocument,
  PackLocation,
  PackTranslationsConfig,
} from "./types";

const UPDATE_COMMAND = "pnpm run build-pack-translations";

// names can contain commas ("Fist, kick")
const quoteNames = (names: string[]) =>
  names.map((n) => JSON.stringify(n)).join(", ");

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function resolvePaths(location: PackLocation, config: PackTranslationsConfig) {
  const { rootPath, publicPath } = location;
  return {
    packSourcePath: path.resolve(
      rootPath,
      config.packSourcePath ?? "src/packs",
    ),
    babeleSourcePath: path.resolve(
      rootPath,
      config.babeleSourcePath ?? "babele-sources",
    ),
    translationsPath: path.resolve(
      rootPath,
      config.translationsPath ?? path.join(publicPath, "lang", "babele"),
    ),
  };
}

async function readJson<T>(filePath: string): Promise<T | undefined> {
  if (!existsSync(filePath)) {
    return undefined;
  }
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function readManifest({
  rootPath,
  publicPath,
  manifestName,
}: PackLocation) {
  const manifest = await readJson<Manifest>(
    path.resolve(rootPath, publicPath, manifestName),
  );
  if (manifest === undefined) {
    throw new Error(`Could not find ${manifestName} in ${publicPath}`);
  }
  return manifest;
}

/** Read the top-level documents (not folders) of one extracted pack. */
async function readPackDocs(dir: string): Promise<PackDocument[]> {
  const files = (await readdir(dir, { recursive: true }))
    .filter((f) => /\.ya?ml$/.test(f))
    .sort();
  const docs = await Promise.all(
    files.map(
      async (f) =>
        load(await readFile(path.join(dir, f), "utf8")) as PackDocument,
    ),
  );
  return docs.filter((doc) => !doc._key?.startsWith("!folders!"));
}

async function languageDirs(translationsPath: string) {
  if (!existsSync(translationsPath)) {
    return [];
  }
  const dirents = await readdir(translationsPath, { withFileTypes: true });
  return dirents
    .filter((d) => d.isDirectory())
    .map((d) => path.join(translationsPath, d.name))
    .sort();
}

/**
 * Work out every generated file and its contents, from the packs in
 * `src/packs`.
 */
async function generate(
  location: PackLocation,
  config: PackTranslationsConfig,
) {
  const paths = resolvePaths(location, config);
  const manifest = await readManifest(location);
  const packs = translatablePacks(manifest, config);

  const packDocs: Record<string, PackDocument[]> = {};
  const sources: Record<string, BabeleFile> = {};
  for (const pack of packs) {
    const dir = path.join(paths.packSourcePath, path.basename(pack.path));
    if (!existsSync(dir)) {
      throw new Error(
        `Pack ${pack.name} has no sources at ${path.relative(location.rootPath, dir)}`,
      );
    }
    packDocs[pack.name] = await readPackDocs(dir);
    sources[babeleFileName(manifest, pack)] = buildBabeleSource(
      pack,
      packDocs[pack.name],
      config,
    );
  }
  const ids = buildIdIndex(packDocs);

  const files = new Map<string, string>();
  for (const [fileName, source] of Object.entries(sources)) {
    files.set(
      path.join(paths.babeleSourcePath, fileName),
      serializeJson(source),
    );
  }
  files.set(
    path.join(paths.babeleSourcePath, ID_INDEX_FILE_NAME),
    serializeJson(ids),
  );
  if (config.mappings !== undefined) {
    files.set(
      path.join(paths.translationsPath, MAPPINGS_FILE_NAME),
      serializeJson(config.mappings),
    );
  }

  const packNamesByFile = Object.fromEntries(
    packs.map((pack) => [babeleFileName(manifest, pack), pack.name]),
  );
  return { paths, sources, ids, files, packNamesByFile };
}

/**
 * Everything that's out of step: generated files which need regenerating,
 * translated files whose `mapping` disagrees with the source, and source files
 * Transifex doesn't know about. An empty list means all is well.
 */
export async function findPackTranslationProblems(
  location: PackLocation,
  config: PackTranslationsConfig,
): Promise<string[]> {
  const { paths, sources, files } = await generate(location, config);
  const relative = (p: string) =>
    path.relative(location.rootPath, p).split(path.sep).join("/");
  const problems: string[] = [];

  for (const [filePath, contents] of files) {
    const actual = existsSync(filePath)
      ? await readFile(filePath, "utf8")
      : undefined;
    if (actual === undefined) {
      problems.push(`${relative(filePath)} is missing: run ${UPDATE_COMMAND}`);
    } else if (actual !== contents) {
      problems.push(
        `${relative(filePath)} is out of date: run ${UPDATE_COMMAND}`,
      );
    }
  }

  if (existsSync(paths.babeleSourcePath)) {
    for (const f of await readdir(paths.babeleSourcePath)) {
      const filePath = path.join(paths.babeleSourcePath, f);
      if (f.endsWith(".json") && !files.has(filePath)) {
        problems.push(
          `${relative(filePath)} doesn't belong to a pack: run ${UPDATE_COMMAND}`,
        );
      }
    }
  }

  for (const langDir of await languageDirs(paths.translationsPath)) {
    for (const [fileName, source] of Object.entries(sources)) {
      const translation = await readJson<BabeleFile>(
        path.join(langDir, fileName),
      );
      if (translation !== undefined && !mappingsMatch(translation, source)) {
        problems.push(
          `${relative(path.join(langDir, fileName))} has a different mapping from its source: run ${UPDATE_COMMAND}`,
        );
      }
    }
  }

  const txConfigPath = path.join(location.rootPath, ".tx", "config");
  if (existsSync(txConfigPath)) {
    const txConfig = await readFile(txConfigPath, "utf8");
    for (const fileName of Object.keys(sources)) {
      const sourcePath = relative(path.join(paths.babeleSourcePath, fileName));
      const pattern = new RegExp(
        `^source_file\\s*=\\s*${escapeRegExp(sourcePath)}\\s*$`,
        "m",
      );
      if (!pattern.test(txConfig)) {
        problems.push(`.tx/config has no resource for ${sourcePath}`);
      }
    }
  }

  return problems;
}

/**
 * Regenerate the source files, and update the translated files to match:
 * renamed documents keep their translations, and `mapping`s are brought into
 * line.
 */
export async function writePackTranslations(
  location: PackLocation,
  config: PackTranslationsConfig,
  log: (...args: any[]) => void,
) {
  const { paths, sources, ids, files, packNamesByFile } = await generate(
    location,
    config,
  );
  const relative = (p: string) => path.relative(location.rootPath, p);
  const oldIds = await readJson<IdIndex>(
    path.join(paths.babeleSourcePath, ID_INDEX_FILE_NAME),
  );
  const langDirs = await languageDirs(paths.translationsPath);

  for (const [fileName, source] of Object.entries(sources)) {
    const packName = packNamesByFile[fileName];
    const renames = findRenames(oldIds?.[packName], ids[packName]);
    const before = await readJson<BabeleFile>(
      path.join(paths.babeleSourcePath, fileName),
    );
    const { added, removed, renamed } = diffEntries(before, source, renames);
    const summary = [
      `${Object.keys(source.entries).length} entries`,
      ...(before === undefined ? ["new"] : []),
      ...(added.length ? [`added: ${quoteNames(added)}`] : []),
      ...(removed.length ? [`removed: ${quoteNames(removed)}`] : []),
      ...(renamed.length
        ? [
            `renamed: ${renamed.map(([a, b]) => `${JSON.stringify(a)} -> ${JSON.stringify(b)}`).join(", ")}`,
          ]
        : []),
    ];
    log(`${packName}: ${summary.join("; ")}`);

    for (const langDir of langDirs) {
      const translationPath = path.join(langDir, fileName);
      if (!existsSync(translationPath)) {
        continue;
      }
      const original = await readFile(translationPath, "utf8");
      const updated = updateTranslationText(original, source, renames);
      if (updated !== undefined) {
        await writeFile(translationPath, updated);
        log(`  updated ${relative(translationPath)}`);
      }
    }
  }

  if (existsSync(paths.babeleSourcePath)) {
    for (const f of await readdir(paths.babeleSourcePath)) {
      const filePath = path.join(paths.babeleSourcePath, f);
      if (f.endsWith(".json") && !files.has(filePath)) {
        await rm(filePath);
        log(`removed ${relative(filePath)}`);
      }
    }
  }

  for (const [filePath, contents] of files) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents);
  }

  const problems = await findPackTranslationProblems(location, config);
  for (const problem of problems) {
    log(`warning: ${problem}`);
  }
}
