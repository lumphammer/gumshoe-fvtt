// Prints built-in V1 themes as V2 theme source that looks the same
// (src/themes/v2FromV1.ts): a starting point for converting them.
//
//   pnpm print:theme-v2 tealTheme             prints one to stdout
//   pnpm print:theme-v2 --out <dir> [ids...]  writes <dir>/<id>.ts for each
//                                             (all of them, without ids)
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { baseThemes } from "../src/themes/baseThemes";
import { themeV2Source, v2FromV1 } from "../src/themes/v2FromV1";

const root = join(import.meta.dirname, "..");
const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const out = outIndex === -1 ? undefined : args[outIndex + 1];
if (outIndex !== -1 && (!out || out.startsWith("--"))) {
  console.error("--out needs a directory");
  process.exit(1);
}
const ids =
  outIndex === -1
    ? args
    : args.filter((_, i) => i !== outIndex && i !== outIndex + 1);

for (const id of ids) {
  if (!(id in baseThemes)) {
    console.error(
      `No built-in theme "${id}": ${Object.keys(baseThemes).join(", ")}`,
    );
    process.exit(1);
  }
}
if (!out && ids.length !== 1) {
  console.error("Name one theme to print, or give --out <dir>");
  process.exit(1);
}

const format = (path: string, source: string) => {
  const result = spawnSync(
    "pnpm",
    ["exec", "oxfmt", `--stdin-filepath=${path}`],
    {
      cwd: root,
      input: source,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
};

for (const id of ids.length > 0 ? ids : Object.keys(baseThemes)) {
  const path = out
    ? resolve(out, `${id}.ts`)
    : join(root, "src/themes", `${id}.ts`);
  const source = format(
    relative(root, path),
    themeV2Source(id, v2FromV1(baseThemes[id])),
  );
  if (out) {
    mkdirSync(resolve(out), { recursive: true });
    writeFileSync(path, source);
    console.error(`wrote ${relative(process.cwd(), path)}`);
  } else {
    process.stdout.write(source);
  }
}
