import { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, it } from "vitest";

import { assertNumericFieldOkayness } from "./functions";

type ErrorTestTuple = [
  string,
  EquipmentFieldMetadata | undefined,
  string,
  unknown,
  string,
];

type OkayTestTuple = [
  string,
  EquipmentFieldMetadata | undefined,
  string,
  unknown,
];

describe("assertNumericFieldOkayness", () => {
  it.each<ErrorTestTuple>([
    ["undefined field", undefined, "foo", undefined, "No field with id foo"],
    [
      "non-numeric field",
      { type: "string", default: "", name: "" },
      "foo",
      undefined,
      "Cannot set min/max on field type string",
    ],
    [
      "non-numeric value",
      { type: "number", default: 0, name: "" },
      "foo",
      "bar",
      'Invalid value "bar" for field  (must be a number)',
    ],
  ])("%s", (_name, field, id, value, error) => {
    expect(() => {
      assertNumericFieldOkayness(field, id, value);
    }).toThrowError(error);
  });

  it.each<OkayTestTuple>([
    ["numeric value", { type: "number", default: 0, name: "" }, "foo", 3],
    [
      "undefined value",
      { type: "number", default: 0, name: "" },
      "foo",
      undefined,
    ],
  ])("%s", (name, field, id, value) => {
    expect(() => {
      assertNumericFieldOkayness(field, id, value);
    }).not.toThrow();
  });
});
