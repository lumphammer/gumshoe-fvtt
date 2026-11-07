import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Call sites apply catalogue classes; only the catalogue reads the palette
// (docs/theming.md, rule 1). These files still read a theme's colours
// directly, from before the catalogue. The list only shrinks: when you convert
// one, take it off.
//
// A source scan, like schemaInitialValues.test.ts: it looks for `.colors`
// and for destructured `colors`.

const notYetConverted = [
  "components/abilities/AbilityTestMW.tsx",
  "components/abilities/PoolCheckbox.tsx",
  "components/characters/MoribundWorld/MwItemGroup.tsx",
  "components/characters/Slug.tsx",
  "components/characters/Weapons/WeaponRowEdit.tsx",
  "components/characters/Weapons/WeaponRow.tsx",
  "components/inputs/RichTextEditor.tsx",
  "components/journalEditorSheet/ImageArea.tsx",
  "components/journalEditorSheet/PageNavigation.tsx",
  "components/settings/SettingsNote.tsx",
  "components/settings/Settings.tsx",
];

// The native world: our parts of Foundry's own UI, which look like Foundry
// and never read the theme at all, not even its fonts (docs/theming.md).
const nativeWorld = [
  /^components\/messageCards\//,
  /^components\/combat\//,
  /^components\/native\//,
  /^components\/inputs\/NativeMenu\//,
  /^components\/GamePauseBanner\.tsx$/,
];

const srcDir = join(import.meta.dirname, "../..");

const sourceFiles = () =>
  readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .map((path) => path.replaceAll("\\", "/"))
    .filter(
      (path) =>
        /\.tsx?$/.test(path) &&
        !/\.test(-d)?\.tsx?$/.test(path) &&
        // themes define colours (and so does loading a custom theme from a
        // file); styled-system is generated
        !/^(themes|styled-system)\//.test(path) &&
        path !== "startup/loadCustomThemes.ts",
    );

const filesMatching = (pattern: RegExp) =>
  sourceFiles()
    .filter((path) => pattern.test(readFileSync(join(srcDir, path), "utf8")))
    .sort();

// `.colors`, or destructuring them: `{ colors }`, `colors: { ... }`
const filesReadingColours = () =>
  filesMatching(/\.colors\b|\{\s*colors\s*[,}]|\bcolors:\s*\{/);

describe("reading theme colours", () => {
  it("happens only in files that haven't been converted yet", () => {
    const reading = filesReadingColours();
    // new ones: use a catalogue class instead
    expect(reading.filter((path) => !notYetConverted.includes(path))).toEqual(
      [],
    );
    // converted ones: take them off the list
    expect(notYetConverted.filter((path) => !reading.includes(path))).toEqual(
      [],
    );
  });
});

describe("the native world", () => {
  it("never uses the catalogue", () => {
    expect(
      filesMatching(/styled-system\/recipes|inputs\/Button"/).filter((path) =>
        nativeWorld.some((area) => area.test(path)),
      ),
    ).toEqual([]);
  });

  it("never reads the theme", () => {
    expect(
      filesMatching(/\b(ThemeContext|useTheme)\b|\.colors\b/).filter((path) =>
        nativeWorld.some((area) => area.test(path)),
      ),
    ).toEqual([]);
  });
});
