import { PresetV1 } from "@lumphammer/investigator-fvtt-types";
import { describe, expectTypeOf, it } from "vitest";

import { ValidatorCardCategories } from "./cardCategoriesValidator";
import { ValidatorEquipmentCategories } from "./equipmentCategoriesValidator";
import { ValidatorPersonalDetails } from "./personalDetailsValidator";
import { ValidatorStats } from "./statsValidator";

// we need to publish types for these settings in an npm package for third
// parties, but on the other hand we also have a zod validator for them, which
// can be used to infer a type. Ideally we would use the inferred type from the
// validator (single source of truth), but that makes it hard to published said
// types without also creating a dependency on zod for the consumers of the
// types. So, we maintain both - but use these type tests to ensure that the zod
// validator and the types are in sync.

describe("statsValidator", () => {
  it("should match the type from the types package", () => {
    expectTypeOf<ValidatorStats>().toExtend<PresetV1["pcStats"]>();
    expectTypeOf<PresetV1["pcStats"]>().toExtend<ValidatorStats>();
    expectTypeOf<ValidatorStats>().toExtend<PresetV1["npcStats"]>();
    expectTypeOf<PresetV1["npcStats"]>().toExtend<ValidatorStats>();
  });
});
describe("personalDetailsValidator", () => {
  it("should match the type from the types package", () => {
    expectTypeOf<ValidatorPersonalDetails>().toExtend<
      PresetV1["personalDetails"]
    >();
    expectTypeOf<
      PresetV1["personalDetails"]
    >().toExtend<ValidatorPersonalDetails>();
  });
});
describe("equipmentCategoriesValidator", () => {
  it("should match the type from the types package", () => {
    expectTypeOf<ValidatorEquipmentCategories>().toExtend<
      PresetV1["equipmentCategories"]
    >();
    expectTypeOf<
      PresetV1["equipmentCategories"]
    >().toExtend<ValidatorEquipmentCategories>();
  });
});
describe("cardCategoriesValidator", () => {
  it("should match the type from the types package", () => {
    expectTypeOf<ValidatorCardCategories>().toExtend<
      PresetV1["cardCategories"]
    >();
    expectTypeOf<
      PresetV1["cardCategories"]
    >().toExtend<ValidatorCardCategories>();
  });
});
