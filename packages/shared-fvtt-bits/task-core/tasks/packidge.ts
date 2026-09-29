import type { TaskArgs } from "../types";

/**
 * create a releasable package
 * (package is a reserved word)
 */
export function packidge({
  manifest,
  buildPath,
  log,
  packagePath = "package",
}: TaskArgs) {
  throw new Error(
    "packidge has been removed - use updated workflow from gh-actions -> ci-cd-reusable",
  );
}

packidge.description = "Create a releasable package (removed!)";
