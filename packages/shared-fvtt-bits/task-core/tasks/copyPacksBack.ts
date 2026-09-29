import { rm } from "fs/promises";
import fs from "fs-extra";
import path from "path";

import type { TaskArgs } from "../types";

export async function copyPacksBack({ buildPath, log, publicPath }: TaskArgs) {
  log("Copying packs back from build folder...");
  const buildPacksPath = path.join(buildPath, "packs");
  const publicPacksPath = path.join(publicPath, "packs");
  await rm(publicPacksPath, { recursive: true, force: true });
  await fs.copy(buildPacksPath, publicPacksPath);
  log("Finished copying packs.");
}
