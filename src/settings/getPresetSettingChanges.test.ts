import { describe, expect, it } from "vitest";

import { getPresetSettingChanges } from "./getPresetSettingChanges";

describe("getPresetSettingChanges", () => {
  it("returns only the settings the preset changes", () => {
    expect(
      getPresetSettingChanges(
        {
          schemaVersion: "v1",
          displayName: "Test",
          useBoost: true,
          useStabilityRules: true,
          longNotes: ["Notes"],
        },
        ["useBoost", "useStabilityRules", "longNotes"],
        { useBoost: false, useStabilityRules: true, longNotes: ["Notes"] },
      ),
    ).toEqual({ useBoost: true });
  });

  it("compares lists and objects by value", () => {
    expect(
      getPresetSettingChanges(
        { schemaVersion: "v1", displayName: "Test", longNotes: ["A", "B"] },
        ["longNotes"],
        { longNotes: ["A"] },
      ),
    ).toEqual({ longNotes: ["A", "B"] });
  });

  it("ignores keys the preset doesn't set, and keys not asked for", () => {
    expect(
      getPresetSettingChanges(
        { schemaVersion: "v1", displayName: "Test", useBoost: true },
        ["useStabilityRules"],
        { useStabilityRules: false },
      ),
    ).toEqual({});
  });
});
