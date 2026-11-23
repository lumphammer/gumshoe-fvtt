import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { IconsManifest } from "react-icons/lib";
import type { PluginOption } from "vite";

/** Where the notices go, relative to the build directory. */
const fileName = "THIRD-PARTY-LICENSES.txt";

/** Files in a package that hold its licence. */
const licenceFileRegex = /^(licen[cs]e|copying)([.-].*)?$/i;

/**
 * Files which go with the licence: Apache's NOTICE, and the notices for code
 * bundled into the package (Prettier's THIRD-PARTY-NOTICES.md).
 */
const noticeFileRegex = /^(notice|third-party-notices)([.-].*)?$/i;

export type BundledPackage = {
  name: string;
  version: string;
  license: string;
  /** The text of each licence file, then each notice file. */
  texts: string[];
};

export type BundledIconSet = (typeof IconsManifest)[number] & {
  text: string;
};

/**
 * The directory of the package a module came from, if it came from
 * `node_modules` (our own code and workspace packages don't). Uses forward
 * slashes, as Vite's module ids do on Windows too.
 */
export function packageDirOf(moduleId: string) {
  // virtual modules start with `\0`; some ids carry a `?query`
  const path = moduleId.replace(/^\0/, "").split("?")[0].replace(/\\/g, "/");
  const marker = "/node_modules/";
  const at = path.lastIndexOf(marker);
  if (at === -1) return undefined;
  const parts = path.slice(at + marker.length).split("/");
  const depth = parts[0].startsWith("@") ? 2 : 1;
  if (parts.length <= depth) return undefined;
  return path.slice(0, at + marker.length) + parts.slice(0, depth).join("/");
}

/**
 * A package's licence texts: its own files, or, for a package published
 * without one, the upstream licence we keep in
 * `licenses/packages/<name>.txt`.
 */
function readPackage(dir: string, licensesDir: string): BundledPackage {
  const manifest = JSON.parse(
    readFileSync(resolve(dir, "package.json"), "utf8"),
  ) as { name: string; version: string; license?: string };
  const files = readdirSync(dir).sort();
  const read = (regex: RegExp) =>
    files
      .filter((file) => regex.test(file))
      .map((file) => readFileSync(resolve(dir, file), "utf8").trim());
  let licences = read(licenceFileRegex);
  if (licences.length === 0) {
    const fallback = resolve(licensesDir, "packages", `${manifest.name}.txt`);
    if (!existsSync(fallback)) {
      throw new Error(
        `${manifest.name} has no licence file: add its upstream licence as ${fallback}`,
      );
    }
    licences = [readFileSync(fallback, "utf8").trim()];
  }
  return {
    name: manifest.name,
    version: manifest.version,
    license: manifest.license ?? "UNKNOWN",
    texts: [...licences, ...read(noticeFileRegex)],
  };
}

/** The packages the given modules came from, sorted by name. */
export function bundledPackages(
  moduleIds: Iterable<string>,
  licensesDir: string,
) {
  const dirs = new Set<string>();
  for (const id of moduleIds) {
    const dir = packageDirOf(id);
    if (dir !== undefined && existsSync(resolve(dir, "package.json"))) {
      dirs.add(dir);
    }
  }
  return [...dirs]
    .map((dir) => readPackage(dir, licensesDir))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The react-icons sets the modules use (`react-icons/fa6` and so on). The
 * icons have their own licences, not react-icons' MIT, and react-icons doesn't
 * ship them, so we keep each set's upstream licence in
 * `licenses/react-icons/<id>.txt`.
 */
export function bundledIconSets(
  moduleIds: Iterable<string>,
  licensesDir: string,
): BundledIconSet[] {
  const ids = new Set<string>();
  for (const id of moduleIds) {
    const match = /[\\/]react-icons[\\/]([a-z0-9]+)[\\/]index\.m?js$/.exec(id);
    if (match !== null && match[1] !== "lib") ids.add(match[1]);
  }
  return IconsManifest.filter((set) => ids.has(set.id)).map((set) => {
    const path = resolve(licensesDir, "react-icons", `${set.id}.txt`);
    if (!existsSync(path)) {
      throw new Error(
        `No licence for the react-icons set ${set.id} (${set.name}): add its upstream licence (${set.licenseUrl}) as ${path}`,
      );
    }
    return { ...set, text: readFileSync(path, "utf8").trim() };
  });
}

const rule = "=".repeat(78);

export function formatNotices(
  packages: BundledPackage[],
  iconSets: BundledIconSet[],
) {
  const parts = [
    `INVESTIGATOR includes the following third-party software, under the
licences below. INVESTIGATOR itself is MIT-licensed (see LICENSE).

The fonts' licences are next to them, in fonts/fontsource/. Longdon Decorative
(fonts/LongdonDecorative.woff2) is by Roger White, who released it into the
public domain (https://web.archive.org/web/20120416090521/http://www.rogersfonts.org.uk/);
we use a fixed version (https://github.com/n3dst4/longdon-decorative-fixed).
Nova Square (fonts/nova-square/) is by Wojciech Kalinowski
(https://github.com/wmk69/Nova), under the SIL Open Font License 1.1: its
licence is next to it.

Credits for the images, the game-icons.net icons and the GUMSHOE SRD are in
the README: https://github.com/lumphammer/gumshoe-fvtt#credits
`,
  ];
  for (const set of iconSets) {
    parts.push(
      `${rule}\n${set.name}, from react-icons (${set.license})\n${set.projectUrl}\n${rule}\n\n${set.text}\n`,
    );
  }
  for (const pkg of packages) {
    parts.push(
      `${rule}\n${pkg.name}@${pkg.version} (${pkg.license})\n${rule}\n\n${pkg.texts.join("\n\n")}\n`,
    );
  }
  return parts.join("\n");
}

/**
 * Write `THIRD-PARTY-LICENSES.txt` and our own `LICENSE` into the build. The
 * minifier drops the licence comments of the packages we bundle, whose
 * licences (MIT and the like) ask for their notices to go with every copy.
 */
export function vitePluginThirdPartyLicenses(): PluginOption {
  let rootDir = process.cwd();
  return {
    name: "third-party-licenses",
    apply: "build",

    configResolved(config) {
      // vite's root is `src/`; LICENSE and licenses/ live in the parent
      rootDir = resolve(config.root, "..");
    },

    generateBundle(_options, bundle) {
      const moduleIds = new Set<string>();
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        for (const id of Object.keys(output.modules)) moduleIds.add(id);
      }
      const licensesDir = resolve(rootDir, "licenses");
      this.emitFile({
        type: "asset",
        fileName,
        source: formatNotices(
          bundledPackages(moduleIds, licensesDir),
          bundledIconSets(moduleIds, licensesDir),
        ),
      });
      this.emitFile({
        type: "asset",
        fileName: "LICENSE",
        source: readFileSync(resolve(rootDir, "LICENSE")),
      });
    },
  };
}
