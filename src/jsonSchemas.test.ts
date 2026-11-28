import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Ajv } from "ajv";
import { describe, expect, it } from "vitest";

import { jsonSchemaBaseUrl } from "./constants";
import { basePresets, defaultSettings } from "./presets";
import { settings } from "./settings/settings";
import ashenStarsExport from "./settings/test_data/ashen_stars_export.json";
import { antiquarianTheme } from "./themes/antiquarianTheme";
import { baseThemes } from "./themes/baseThemes";
import { mutantCityBlueTheme } from "./themes/mutantCityBlueTheme";
import { unsafeRealityTheme } from "./themes/unsafeRealityTheme";

// The types package's JSON schemas (scripts/jsonSchemas.ts), checked
// against the built-in presets and themes, as JSON.

const schemasDir = join(
  import.meta.dirname,
  "../packages/investigator-fvtt-types/schemas",
);

const ajv = new Ajv({ allErrors: true, strict: true });
for (const file of readdirSync(schemasDir)) {
  ajv.addSchema(JSON.parse(readFileSync(join(schemasDir, file), "utf8")));
}

const validate = (file: string, data: unknown) => {
  const schema = ajv.getSchema(`${jsonSchemaBaseUrl}${file}`);
  if (!schema) throw new Error(`no schema ${file}`);
  // none of the schemas is async
  void schema(JSON.parse(JSON.stringify(data)));
  return schema.errors ?? [];
};

describe("preset-v1.schema.json", () => {
  it.each(Object.entries(basePresets))("accepts %s", (_, preset) => {
    expect(validate("preset-v1.schema.json", preset)).toEqual([]);
  });

  it("accepts $schema", () => {
    expect(
      validate("preset-v1.schema.json", {
        ...defaultSettings,
        $schema: "preset-v1.schema.json",
      }),
    ).toEqual([]);
  });

  it("refuses an unknown key", () => {
    expect(
      validate("preset-v1.schema.json", { ...defaultSettings, useCrads: true }),
    ).not.toEqual([]);
  });
});

describe("settings-export-v1.schema.json", () => {
  it("accepts an export", () => {
    expect(
      validate("settings-export-v1.schema.json", ashenStarsExport),
    ).toEqual([]);
  });

  it("has every exportable setting, and nothing else", () => {
    const schema = JSON.parse(
      readFileSync(join(schemasDir, "settings-export-v1.schema.json"), "utf8"),
    );
    expect(Object.keys(schema.properties).sort()).toEqual(
      [
        "$schema",
        ...Object.entries(settings)
          .filter(([, setting]) => setting.exportable)
          .map(([key]) => key),
      ].sort(),
    );
  });

  it("accepts every setting a preset has", () => {
    const { schemaVersion: _, displayName: __, ...preset } = defaultSettings;
    expect(validate("settings-export-v1.schema.json", preset)).toEqual([]);
  });

  it("refuses a preset's name", () => {
    expect(
      validate("settings-export-v1.schema.json", { displayName: "Mine" }),
    ).not.toEqual([]);
  });
});

describe("theme-v1.schema.json", () => {
  it("refuses a display text transform that isn't one", () => {
    expect(
      validate("theme-v1.schema.json", {
        ...antiquarianTheme,
        displayFontTextTransform: { bogus: 42 },
      }),
    ).not.toEqual([]);
  });

  it.each([
    ["antiquarianTheme", antiquarianTheme],
    ["mutantCityBlueTheme", mutantCityBlueTheme],
    ["unsafeRealityTheme", unsafeRealityTheme],
  ])("accepts %s", (_, theme) => {
    expect(validate("theme-v1.schema.json", theme)).toEqual([]);
    expect(validate("theme.schema.json", theme)).toEqual([]);
  });
});

describe("theme-v2.schema.json", () => {
  it.each(Object.entries(baseThemes))("accepts %s", (_, theme) => {
    expect(validate("theme-v2.schema.json", theme)).toEqual([]);
    expect(validate("theme.schema.json", theme)).toEqual([]);
  });

  const theme = baseThemes["niceTheme"];

  it.each<[string, object]>([
    ["a top-level key", { ...theme, pallete: {} }],
    [
      "a palette entry",
      { ...theme, palette: { ...theme.palette, acent: "red" } },
    ],
    ["a recipe", { ...theme, catalogue: { bagde: { base: {} } } }],
    ["a slot", { ...theme, catalogue: { tabs: { base: { tub: {} } } } }],
    [
      "a variant's value",
      { ...theme, catalogue: { badge: { variants: { tone: { dangr: {} } } } } },
    ],
    [
      "a state the recipe hasn't",
      { ...theme, catalogue: { badge: { states: { checked: {} } } } },
    ],
    [
      "a compound variant with no variant",
      { ...theme, catalogue: { badge: { compoundVariants: [{ css: {} }] } } },
    ],
  ])("refuses a misspelt %s", (_, bad) => {
    expect(validate("theme-v2.schema.json", bad)).not.toEqual([]);
    expect(validate("theme.schema.json", bad)).not.toEqual([]);
  });

  it("refuses a compound variant with neither css nor states", () => {
    expect(
      validate("theme-v2.schema.json", {
        ...theme,
        catalogue: { badge: { compoundVariants: [{ tone: "danger" }] } },
      }),
    ).not.toEqual([]);
  });

  it("accepts a boolean compound variant with only states", () => {
    expect(
      validate("theme-v2.schema.json", {
        ...theme,
        catalogue: {
          partyCell: { compoundVariants: [{ odd: true, states: {} }] },
        },
      }),
    ).toEqual([]);
  });

  it("accepts any CSS in a style", () => {
    expect(
      validate("theme-v2.schema.json", {
        ...theme,
        catalogue: {
          badge: {
            base: { colour: "red", "&:hover": { anything: 1 } },
            variants: { tone: { danger: { states: { pressed: {} } } } },
            compoundVariants: [{ tone: "danger", css: { color: "red" } }],
          },
        },
      }),
    ).toEqual([]);
  });
});
