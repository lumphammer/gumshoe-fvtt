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
//
// these must be `toEqualTypeOf`, not mutual `toExtend`. a missing *optional*
// property passes assignability in both directions, so the mutual form was
// green throughout HI-04, where the stats validator was missing `min`/`max`
// and zod was silently stripping them on import.

describe("statsValidator", () => {
  it("should match the type from the types package", () => {
    expectTypeOf<ValidatorStats>().toEqualTypeOf<PresetV1["pcStats"]>();
    expectTypeOf<ValidatorStats>().toEqualTypeOf<PresetV1["npcStats"]>();
  });
});
describe("personalDetailsValidator", () => {
  it("should match the type from the types package", () => {
    expectTypeOf<ValidatorPersonalDetails>().toEqualTypeOf<
      PresetV1["personalDetails"]
    >();
  });
});
describe("equipmentCategoriesValidator", () => {
  it("should match the type from the types package", () => {
    expectTypeOf<ValidatorEquipmentCategories>().toEqualTypeOf<
      PresetV1["equipmentCategories"]
    >();
  });
});
describe("cardCategoriesValidator", () => {
  it("should match the type from the types package", () => {
    expectTypeOf<ValidatorCardCategories>().toEqualTypeOf<
      PresetV1["cardCategories"]
    >();
  });
});
