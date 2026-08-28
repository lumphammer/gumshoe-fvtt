import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { pathOfCthulhuPreset } from "../presets";
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
  // `pathOfCthulhuPreset` is the built-in default preset, so a setting which
  // shares its name must register the same default. Copying the wrong preset
  // property is otherwise invisible whenever the two values happen to match.
  const presetBackedSettings = Object.keys(pathOfCthulhuPreset).filter(
    (key) => key in settings,
  );

  it.each(presetBackedSettings)(
    "registers the matching preset default for %s",
    (key) => {
      expect(settings[key as keyof typeof settings].default).toEqual(
        pathOfCthulhuPreset[key as keyof typeof pathOfCthulhuPreset],
      );
    },
  );

  // The value check above can't see a setting which reads the *wrong* preset
  // property when both properties happen to hold the same value - which is
  // exactly the state a copy-paste error hides in. So we also check the source
  // text: within each setting definition, the preset property named in
  // `default:` must match that definition's `key`.
  it("reads each preset default from the identically-named property", () => {
    const source = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "settings.ts"),
      "utf8",
    );
    const definitions = source.split(/^ {4}key: "/m).slice(1);
    const presetBackedDefinitions = definitions.flatMap((definition) => {
      const key = definition.slice(0, definition.indexOf('"'));
      const presetProperty = /^ {4}default: pathOfCthulhuPreset\.(\w+),$/m.exec(
        definition,
      )?.[1];
      return presetProperty === undefined ? [] : [[key, presetProperty]];
    });

    // a sanity floor, so that a future reformat which stops the scan matching
    // anything fails loudly instead of passing vacuously
    expect(presetBackedDefinitions.length).toBeGreaterThanOrEqual(15);
    expect(
      presetBackedDefinitions.filter(([key, property]) => key !== property),
    ).toEqual([]);
  });

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
      expect(() =>
        validator?.parse([{ name: "foo", type: "potato" }]),
      ).toThrow();
      expect(() => validator?.parse([{ name: "foo", type: 5 }])).toThrow();
      expect(() => validator?.parse([{ name: "foo", type: null }])).toThrow();
      expect(() => validator?.parse([{ name: "foo" }])).toThrow();
      expect(() => validator?.parse([{ type: "text" }])).toThrow();
      expect(() => validator?.parse([{ name: 5, type: "text" }])).toThrow();
      expect(() => validator?.parse([{ name: null, type: "text" }])).toThrow();
      expect(() => validator?.parse({ name: "foo", type: "text" })).toThrow();
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
      ).toThrow();
      expect(() =>
        validator?.parse({
          foo: {
            default: 3,
          },
        }),
      ).toThrow();
      expect(() =>
        validator?.parse({
          foo: {
            name: "Foo",
          },
        }),
      ).toThrow();
      expect(() => validator?.parse(null)).toThrow();
      expect(() => validator?.parse(5)).toThrow();
    });
  });

  function makeValidatorTest<T>(validator: z.ZodType<T> | undefined) {
    expect(validator).toBeDefined();
    return {
      expectParseOkay(this: void, value: unknown) {
        expect(validator!.parse(value)).toEqual(value);
      },
      expectParseError(this: void, value: unknown) {
        expect(() => validator!.parse(value)).toThrowError();
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
