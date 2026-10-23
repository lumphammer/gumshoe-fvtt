import {
  type PackTranslationsConfig,
  writePackTranslations,
} from "../packTranslations";
import type { TaskArgs, TaskFunction } from "../types";

/**
 * Make a task which writes the untranslated Babele files for the compendium
 * packs, from their sources in `src/packs`. Once committed and pushed to
 * Transifex, translators see the new and changed entries. See
 * `PackTranslationsConfig` for the options.
 */
export function configureBuildPackTranslations(
  config: PackTranslationsConfig,
): TaskFunction {
  const buildPackTranslations = async ({
    rootPath,
    publicPath,
    manifestName,
    log,
  }: TaskArgs) => {
    log("Building pack translations");
    await writePackTranslations(
      { rootPath, publicPath, manifestName },
      config,
      log,
    );
  };
  buildPackTranslations.description = "Build pack translations";
  return buildPackTranslations;
}

export const buildPackTranslations = configureBuildPackTranslations({});
