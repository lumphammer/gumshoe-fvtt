#!/usr/bin/env -S sh -c '"`dirname $0`/../node_modules/.bin/tsx" "$0" "$@"'

// Export one actor (with its embedded items and effects) from a Foundry
// world's LevelDB as a JSON fixture.
//
// Usage: scripts/export-actor-fixture.ts <world data dir> <actor name> <out.json>
// e.g.   scripts/export-actor-fixture.ts \
//          ~/foundrydata/v14/Data/worlds/gumshoe-world/data "Bill Zebub" \
//          src/module/snapshots/bench/pc.fixture.json
//
// The world's database is copied first, so this is safe to run while Foundry
// has it open.

import { execFileSync } from "child_process";
import fs from "fs/promises";
import { createRequire } from "module";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";

const [worldDataDir, actorName, outPath] = process.argv.slice(2);
if (!worldDataDir || !actorName || !outPath) {
  console.error(
    "Usage: export-actor-fixture.ts <world data dir> <actor name> <out.json>",
  );
  process.exit(1);
}

// the cli is a dependency of shared-fvtt-bits, not of this package
const require = createRequire(
  path.resolve(
    import.meta.dirname,
    "../packages/shared-fvtt-bits/package.json",
  ),
);
const { extractPack } = (await import(
  pathToFileURL(require.resolve("@foundryvtt/foundryvtt-cli")).href
)) as typeof import("@foundryvtt/foundryvtt-cli");

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "actor-fixture-"));
try {
  const dbCopy = path.join(tmp, "actors");
  await fs.cp(path.join(worldDataDir, "actors"), dbCopy, { recursive: true });
  await fs.rm(path.join(dbCopy, "LOCK"), { force: true });
  const outDir = path.join(tmp, "out");
  await extractPack(dbCopy, outDir, {});

  for (const file of await fs.readdir(outDir)) {
    const actor = JSON.parse(
      await fs.readFile(path.join(outDir, file), "utf8"),
    );
    if (actor.name !== actorName) continue;
    // `_key` is an artefact of the LevelDB layout, not part of document source
    const json = JSON.stringify(
      actor,
      (k, v) => (k === "_key" ? undefined : v),
      2,
    );
    await fs.writeFile(outPath, `${json}\n`);
    // match `pnpm format:check`
    execFileSync(
      path.resolve(import.meta.dirname, "../node_modules/.bin/oxfmt"),
      ["--write", outPath],
    );
    console.log(
      `Wrote ${actorName} (${actor.items.length} items) to ${outPath}`,
    );
    process.exit(0);
  }
  console.error(`No actor named "${actorName}" found`);
  process.exit(1);
} finally {
  await fs.rm(tmp, { recursive: true, force: true });
}
