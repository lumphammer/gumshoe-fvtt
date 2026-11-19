import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { describe, expect, test } from "vitest";

import {
  bundledIconSets,
  bundledPackages,
  formatNotices,
  packageDirOf,
} from "./vitePluginThirdPartyLicenses";

const nm = "/repo/node_modules/.pnpm/x@1/node_modules";
const licensesDir = resolve(__dirname, "..", "licenses");

/** A fake package in a temporary `node_modules`. */
function fakePackage(files: Record<string, string>, name = "some-package") {
  const dir = join(mkdtempSync(join(tmpdir(), "licences-")), "node_modules");
  const pkgDir = join(dir, name);
  mkdirSync(pkgDir, { recursive: true });
  writeFileSync(
    join(pkgDir, "package.json"),
    JSON.stringify({ name, version: "1.0.0", license: "MIT" }),
  );
  for (const [name, text] of Object.entries(files)) {
    writeFileSync(join(pkgDir, name), text);
  }
  return join(pkgDir, "index.js");
}

describe("packageDirOf", () => {
  test("finds the innermost package, scoped or not", () => {
    expect(packageDirOf(`${nm}/react/cjs/react.js`)).toBe(`${nm}/react`);
    expect(packageDirOf(`${nm}/@dnd-kit/core/dist/x.js`)).toBe(
      `${nm}/@dnd-kit/core`,
    );
  });

  test("strips virtual prefixes and queries", () => {
    expect(packageDirOf(`\0${nm}/immer/dist/x.js?commonjs`)).toBe(
      `${nm}/immer`,
    );
  });

  test("reads Windows paths, with either slash", () => {
    expect(packageDirOf("C:/repo/node_modules/react/index.js")).toBe(
      "C:/repo/node_modules/react",
    );
    expect(packageDirOf("C:\\repo\\node_modules\\react\\index.js")).toBe(
      "C:/repo/node_modules/react",
    );
  });

  test("ignores our own code", () => {
    expect(packageDirOf("/repo/src/module/x.ts")).toBeUndefined();
  });
});

describe("bundledPackages", () => {
  test("reads each package once, with its licence text", () => {
    const reactDir = resolve(__dirname, "..", "node_modules", "react");
    const packages = bundledPackages(
      [
        join(reactDir, "index.js"),
        join(reactDir, "jsx-runtime.js"),
        "/repo/src/x.ts",
      ],
      licensesDir,
    );
    expect(packages).toHaveLength(1);
    expect(packages[0].name).toBe("react");
    expect(packages[0].license).toBe("MIT");
    expect(packages[0].texts[0]).toMatch(/Copyright \(c\) Meta/);
  });

  test("includes notices for code bundled into a package", () => {
    const id = fakePackage({
      LICENSE: "MIT, us",
      "THIRD-PARTY-NOTICES.md": "MIT, them",
    });
    expect(bundledPackages([id], licensesDir)[0].texts).toEqual([
      "MIT, us",
      "MIT, them",
    ]);
  });

  test("uses our copy of the licence for a package published without one", () => {
    const id = fakePackage({}, "react-remove-scroll-bar");
    expect(bundledPackages([id], licensesDir)[0].texts[0]).toMatch(
      /Copyright \(c\) \d+ Anton Korzunov/,
    );
  });

  test("fails for a package with notices but no licence", () => {
    const id = fakePackage({ NOTICE: "Some notice" });
    expect(() => bundledPackages([id], licensesDir)).toThrow(
      /some-package has no licence file/,
    );
  });

  test("fails for a package with no licence anywhere", () => {
    const id = fakePackage({});
    expect(() => bundledPackages([id], licensesDir)).toThrow(
      /some-package has no licence file/,
    );
  });
});

describe("bundledIconSets", () => {
  test("names the react-icons sets in use, with their licences", () => {
    const sets = bundledIconSets(
      [`${nm}/react-icons/fa6/index.mjs`, `${nm}/react-icons/lib/index.mjs`],
      licensesDir,
    );
    expect(sets.map((set) => set.id)).toEqual(["fa6"]);
    expect(sets[0].text).toMatch(/Font Awesome Free License/);
  });

  test("fails for a set we have no licence for", () => {
    expect(() =>
      bundledIconSets([`${nm}/react-icons/gi/index.mjs`], licensesDir),
    ).toThrow(/No licence for the react-icons set gi/);
  });
});

describe("formatNotices", () => {
  test("gives each package and icon set a section", () => {
    const text = formatNotices(
      [
        {
          name: "some-package",
          version: "1.0.0",
          license: "MIT",
          texts: ["Copyright (c) Someone"],
        },
      ],
      [
        {
          id: "xx",
          name: "Some Icons",
          projectUrl: "https://example.com",
          license: "MIT",
          licenseUrl: "https://example.com/LICENSE",
          text: "Copyright (c) Icon Person",
        },
      ],
    );
    expect(text).toContain("some-package@1.0.0 (MIT)\n");
    expect(text).toContain("Copyright (c) Someone");
    expect(text).toContain("Some Icons, from react-icons (MIT)");
    expect(text).toContain("Copyright (c) Icon Person");
  });
});
