import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createSetting } from "./createSettings";
import { settings } from "./settings";

describe("createSetting", () => {
  describe("no validator", () => {
    it("should return a setting object", () => {
      const setting = createSetting()(Object)({
        key: "test",
        name: "Test",
        default: { a: 1 },
      });
      expect(setting.validator).toBeUndefined();
      expect(setting.exportable).toBe(true);
      expect(setting.key).toBe("test");
    });
  });
  describe("validator", () => {
    it("should return a setting object", () => {
      const validator = z.object({ a: z.number() });
      const setting = createSetting()(Object, validator)({
        key: "test",
        name: "Test",
        default: { a: 1 },
      });
      expect(setting.validator).toBe(validator);
      expect(setting.exportable).toBe(true);
    });
  });
  // it("should return a setting object", () => {
  //   const setting = createSetting()(Object, z.string())({
  //     key: "test",
  //     name: "Test",
  //     default: { a: 1 },
  //   });
  //   expect(setting.validator).toBeDefined();
  //   expect(setting.validator?.parse({ a: 1 })).toEqual({ a: 1 });
  //   expect(() => setting.validator?.parse(null)).toThrow();
  //   expect(() => setting.validator?.parse(5)).toThrow();
  //   expect(() => setting.validator?.parse("")).toThrow();
  // });
});

describe("settings", () => {
  describe("personalDetails", () => {
    it("should be an array of strings", () => {
      const validator = settings.personalDetails.validator;
      expect(validator).toBeDefined();
      expect(validator?.parse([])).toEqual([]);
      expect(validator?.parse([{ name: "foo", type: "item" }])).toEqual([
        { name: "foo", type: "item" },
      ]);
      expect(validator?.parse([{ name: "foo", type: "text" }])).toEqual([
        { name: "foo", type: "text" },
      ]);
      expect(() => validator?.parse([{ name: "foo", type: "potato" }])).toThrow(
        "Invalid option",
      );
      expect(() => validator?.parse([{ name: "foo", type: 5 }])).toThrow(
        "Invalid option",
      );
      expect(() => validator?.parse([{ name: "foo", type: null }])).toThrow(
        "Invalid option",
      );
      expect(() => validator?.parse([{ name: "foo" }])).toThrow(
        "Invalid option",
      );
      expect(() => validator?.parse([{ type: "text" }])).toThrow(
        "Invalid input",
      );
      expect(() => validator?.parse([{ name: 5, type: "text" }])).toThrow(
        "Invalid input",
      );
      expect(() => validator?.parse([{ name: null, type: "text" }])).toThrow(
        "Invalid input",
      );
      expect(() => validator?.parse({ name: "foo", type: "text" })).toThrow(
        "Invalid input: expected array",
      );
    });
  });
  describe("Stats validator", () => {
    it.each(["pcStats", "npcStats"])("should validate %s", (key) => {
      const validator = settings[key as keyof typeof settings].validator;
      expect(validator).toBeDefined();
      expect(validator?.parse({})).toEqual({});
      expect(
        validator?.parse({
          foo: {
            name: "Foo",
            default: 3,
          },
        }),
      ).toEqual({
        foo: {
          name: "Foo",
          default: 3,
        },
      });
      expect(
        validator?.parse({
          foo: {
            name: "Foo",
            default: 3,
          },
          bar: {
            name: "Bar",
            default: 5,
          },
        }),
      ).toEqual({
        foo: {
          name: "Foo",
          default: 3,
        },
        bar: {
          name: "Bar",
          default: 5,
        },
      });
      expect(() =>
        validator?.parse({
          name: "Foo",
          default: 3,
        }),
      ).toThrow(/Invalid input: expected object, received number/);
      expect(() =>
        validator?.parse({
          foo: {
            default: 3,
          },
        }),
      ).toThrow("Invalid input");
      expect(() =>
        validator?.parse({
          foo: {
            name: "Foo",
          },
        }),
      ).toThrow("Invalid input");
      expect(() => validator?.parse(null)).toThrow("Invalid input");
      expect(() => validator?.parse(5)).toThrow("Invalid input");
    });
  });

  function makeValidatorTest<T>(validator: z.ZodType<T> | undefined) {
    expect(validator).toBeDefined();
    return {
      expectParseOkay(this: void, value: unknown) {
        // oxlint-disable-next-line no-standalone-expect
        expect(validator!.parse(value)).toEqual(value);
      },
      expectParseError(this: void, value: unknown) {
        // oxlint-disable-next-line no-standalone-expect
        expect(() => validator!.parse(value)).toThrowError("Invalid input");
      },
    };
  }

  describe("equipmentCategories", () => {
    it("should validate equipment categories", () => {
      expect(settings.equipmentCategories.validator).toBeDefined();
      const { expectParseOkay, expectParseError } = makeValidatorTest(
        settings.equipmentCategories.validator,
      );
      expectParseOkay({});
      expectParseOkay({
        foo: {
          name: "Foo",
          fields: {},
        },
      });
      expectParseOkay({
        foo: {
          name: "Foo",
          fields: {
            bar: {
              name: "Bar",
              type: "string",
              default: "",
            },
          },
        },
      });
      expectParseOkay({
        foo: {
          name: "Foo",
          fields: {
            bar: {
              name: "Bar",
              type: "number",
              default: 0,
            },
          },
        },
      });
      expectParseOkay({
        foo: {
          name: "Foo",
          fields: {
            bar: {
              name: "Bar",
              type: "number",
              default: 0,
              min: 0,
            },
          },
        },
      });
      expectParseOkay({
        foo: {
          name: "Foo",
          fields: {
            bar: {
              name: "Bar",
              type: "number",
              default: 0,
              max: 100,
            },
          },
        },
      });
      expectParseOkay({
        foo: {
          name: "Foo",
          fields: {
            bar: {
              name: "Bar",
              type: "number",
              default: 0,
              min: 0,
              max: 100,
            },
          },
        },
      });
      expectParseOkay({
        foo: {
          name: "Foo",
          fields: {
            bar: {
              name: "Bar",
              type: "checkbox",
              default: false,
            },
          },
        },
      });
      expectParseError({
        foo: {
          name: "Foo",
        },
      });
      expectParseError({
        foo: {
          fields: {
            bar: {
              name: "Bar",
              type: "checkbox",
              default: false,
            },
          },
        },
      });
      expectParseError({
        foo: {
          fields: {
            name: "Bar",
            bar: {
              type: "checkbox",
              default: false,
            },
          },
        },
      });
      expectParseError({
        foo: {
          fields: {
            name: "Bar",
            bar: {
              name: "Bar",
              default: false,
            },
          },
        },
      });
      expectParseError({
        foo: {
          fields: {
            name: "Bar",
            bar: {
              name: "Bar",
              type: "checkbox",
            },
          },
        },
      });
    });
  });
});
