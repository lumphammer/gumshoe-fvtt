import { expect, it } from "vitest";

import ashenStarsExport from "./test_data/ashen_stars_export.json";
import { validateImportedSettings } from "./validateImportedSettings";

it("should validate valid settings", () => {
  const validatedResult = validateImportedSettings(
    JSON.stringify(ashenStarsExport),
  );
  expect(validatedResult).toEqual(ashenStarsExport);
});

it("should accept an older export without the damage application settings", () => {
  const validatedResult = validateImportedSettings(
    JSON.stringify(ashenStarsExport),
  );
  expect(validatedResult).not.toHaveProperty("useDamageApplication");
  expect(validatedResult).not.toHaveProperty("useGunfireOnHumans");
  expect(validatedResult).not.toHaveProperty("useCriticalHits");
  expect(validatedResult).not.toHaveProperty("useLethalityAndAutofire");
  expect(validatedResult).not.toHaveProperty("fullAutoSpendAbilities");
  expect(validatedResult).not.toHaveProperty("useShotDryAndJams");
  expect(validatedResult).not.toHaveProperty("useExtendedRange");
  expect(validatedResult).not.toHaveProperty("useWalkingFire");
  expect(validatedResult).not.toHaveProperty("walkingFireSpendAbilities");
  expect(validatedResult).not.toHaveProperty("useWoundStatusEffects");
  for (const key of [
    "useStabilityRules",
    "stabilityAbility",
    "useSanityRules",
    "sanityAbility",
    "sanityCapAbility",
    "sanityCapBase",
    "useStabilityStates",
    "stabilityStates",
    "useBonds",
    "bondRebuildSpendCategory",
    "useTrauma",
    "traumaTypes",
    "useNetworkContacts",
    "networkAbility",
  ]) {
    expect(validatedResult).not.toHaveProperty(key);
  }
});

it("should preserve the damage application settings through a round trip", () => {
  const exportedSettings = {
    useDamageApplication: true,
    useGunfireOnHumans: true,
    useCriticalHits: false,
    useLethalityAndAutofire: true,
    useShotDryAndJams: true,
    useExtendedRange: true,
    useWalkingFire: true,
    useWoundStatusEffects: true,
    walkingFireSpendAbilities: ["Athletics"],
    fullAutoSpendAbilities: ["Athletics", "Sanity"],
  };

  expect(validateImportedSettings(JSON.stringify(exportedSettings))).toEqual(
    exportedSettings,
  );
});

it("should preserve the Sanity & Stability settings through a round trip", () => {
  const exportedSettings = {
    useStabilityRules: true,
    stabilityAbility: "Composure",
    useSanityRules: true,
    sanityAbility: "Humanity",
    sanityCapAbility: "Corruption",
    sanityCapBase: 8,
    useStabilityStates: true,
    stabilityStates: {
      shaken: { name: "Rattled", upTo: 1 },
      shattered: { name: "Broken", upTo: -4 },
      gone: { name: "Lost", upTo: -10 },
    },
    useBonds: true,
    bondRebuildSpendCategory: "Social",
    useTrauma: true,
    traumaTypes: [
      {
        id: "gore",
        name: "Gore",
        difficulty: 3,
        adaptedDifficulty: 2,
        causesSanityLoss: false,
        useAdaptation: true,
        cappedAbilities: ["Charm"],
        capsBonds: true,
        refreshPenalty: 1,
      },
    ],
  };

  expect(validateImportedSettings(JSON.stringify(exportedSettings))).toEqual(
    exportedSettings,
  );
});

it("should preserve the Network contacts settings through a round trip", () => {
  const exportedSettings = { useNetworkContacts: true, networkAbility: "Pals" };

  expect(validateImportedSettings(JSON.stringify(exportedSettings))).toEqual(
    exportedSettings,
  );
});

it("should reject duplicate trauma type ids", () => {
  const type = {
    id: "gore",
    name: "Gore",
    difficulty: 3,
    adaptedDifficulty: 2,
    causesSanityLoss: false,
    useAdaptation: false,
    cappedAbilities: [],
    capsBonds: false,
    refreshPenalty: 0,
  };
  expect(() =>
    validateImportedSettings(JSON.stringify({ traumaTypes: [type, type] })),
  ).toThrow();
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

it("should preserve card category style keys through a round trip", () => {
  const exportedSettings = {
    cardCategories: [
      {
        id: "clue",
        singleName: "Clue",
        pluralName: "Clues",
        styleKey: "cardStyleA",
        threshold: 3,
        thresholdType: "goal" as const,
      },
    ],
  };

  expect(validateImportedSettings(JSON.stringify(exportedSettings))).toEqual(
    exportedSettings,
  );
});

it("should preserve equipment field bounds and visibility through a round trip", () => {
  const exportedSettings = {
    equipmentCategories: {
      general: {
        name: "General",
        fields: {
          quantity: {
            name: "Quantity",
            type: "number" as const,
            default: 1,
            min: 0,
            max: 99,
            visibleToLimited: false,
          },
        },
      },
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
