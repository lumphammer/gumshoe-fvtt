import { expect, it } from "vitest";

import ashenStarsExport from "./test_data/ashen_stars_export.json";
import { validateImportedSettings } from "./validateImportedSettings";

it("should validate valid settings", () => {
  const validatedResult = validateImportedSettings(
    JSON.stringify(ashenStarsExport),
  );
  expect(validatedResult).toEqual(ashenStarsExport);
});

it("should validate an empty object", () => {
  const validatedResult = validateImportedSettings("{}");
  expect(validatedResult).toEqual({});
});

it("should preserve stat bounds through an export/import round trip", () => {
  const exportedSettings = {
    pcStats: {
      health: { name: "Health", default: 10, min: 0, max: 20 },
    },
    npcStats: {
      alertness: { name: "Alertness", default: 0, min: -5, max: 5 },
    },
  };

  expect(validateImportedSettings(JSON.stringify(exportedSettings))).toEqual(
    exportedSettings,
  );
});

it("should throw an error if the settings are the wrong type", () => {
  expect(() =>
    validateImportedSettings(
      JSON.stringify({ ...ashenStarsExport, npcStats: "not an object" }),
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `[ZodValidationError: Validation error: Invalid input: expected record, received string at "npcStats"]`,
  );
});

it("should throw an error if there is an unknown key", () => {
  expect(() =>
    validateImportedSettings(
      JSON.stringify({ ...ashenStarsExport, unknownKey: "unknown value" }),
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    `[ZodValidationError: Validation error: Unrecognized key: "unknownKey"]`,
  );
});

it("should reject duplicate card category ids", () => {
  const category = {
    id: "duplicate",
    singleName: "Category",
    pluralName: "Categories",
    threshold: 3,
    thresholdType: "none",
  } as const;

  expect(() =>
    validateImportedSettings(
      JSON.stringify({ cardCategories: [category, category] }),
    ),
  ).toThrow('Card category ID "duplicate" is duplicated');
});

it("should throw an error if the text is not JSON", () => {
  // this is now testing for the node 20 version of the error
  expect(() =>
    validateImportedSettings("not json"),
  ).toThrowErrorMatchingInlineSnapshot(
    `[SyntaxError: Unexpected token 'o', "not json" is not valid JSON]`,
  );
});
