import { expect, it } from "vitest";

import { applyEquipmentFieldDefaults } from "./applyEquipmentFieldDefaults";

it("preserves falsy values and defaults only nullish or missing fields", () => {
  const fields = applyEquipmentFieldDefaults(
    {
      emptyString: "",
      zero: 0,
      unchecked: false,
      explicitUndefined: undefined as unknown as string,
    },
    {
      emptyString: { name: "Text", type: "string", default: "default" },
      zero: { name: "Number", type: "number", default: 42 },
      unchecked: { name: "Checkbox", type: "checkbox", default: true },
      explicitUndefined: {
        name: "Undefined",
        type: "string",
        default: "default",
      },
      missing: { name: "Missing", type: "number", default: 7 },
    },
  );

  expect(fields).toEqual({
    emptyString: "",
    zero: 0,
    unchecked: false,
    explicitUndefined: "default",
    missing: 7,
  });
});
