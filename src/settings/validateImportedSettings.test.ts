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

it("should throw an error if the text is not JSON", () => {
  // this is now testing for the node 20 version of the error
  expect(() =>
    validateImportedSettings("not json"),
  ).toThrowErrorMatchingInlineSnapshot(
    `[SyntaxError: Unexpected token 'o', "not json" is not valid JSON]`,
  );
});
