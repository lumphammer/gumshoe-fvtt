import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";

/**
 * The parts of Foundry's `common/` the benchmarks use. These are Foundry's own
 * implementations, copied out of the dev container by
 * `scripts/fetch-foundry-common.sh`, so the diff-merge numbers are for the
 * real `mergeObject`.
 */
export interface FoundryHelpers {
  mergeObject: <T>(
    original: T,
    other: unknown,
    options?: { applyOperators?: boolean },
  ) => T;
  deepClone: <T>(original: T) => T;
  ForcedDeletion: new () => object;
}

export async function loadFoundryHelpers(): Promise<FoundryHelpers> {
  const root =
    process.env["FOUNDRY_COMMON"] ??
    fileURLToPath(new URL("../../../../.foundry-common/", import.meta.url));
  const helpersPath = `${root}/utils/helpers.mjs`;
  if (!fs.existsSync(helpersPath)) {
    throw new Error(
      `Foundry's common/ sources not found at ${root}. Run ` +
        "scripts/fetch-foundry-common.sh (or set FOUNDRY_COMMON).",
    );
  }
  const helpers = await import(
    /* @vite-ignore */ pathToFileURL(helpersPath).href
  );
  const operators = await import(
    /* @vite-ignore */ pathToFileURL(`${root}/data/operators.mjs`).href
  );
  return {
    mergeObject: helpers.mergeObject,
    deepClone: helpers.deepClone,
    ForcedDeletion: operators.ForcedDeletion,
  };
}
