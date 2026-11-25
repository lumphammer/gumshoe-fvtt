import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";
import { describe, expect, it } from "vitest";

import { defaultSettings } from "../presets";
import { resolvePresetSettings } from "./resolvePresetSettings";

describe("resolvePresetSettings", () => {
  it("fills in defaults for everything the preset doesn't set", () => {
    const resolved = resolvePresetSettings({
      schemaVersion: "v1",
      displayName: "Test",
      defaultThemeName: "tealTheme",
      useBoost: true,
      // only what the test needs; the rest are required by the type
    } as PresetV1);
    expect(resolved).toEqual({
      ...defaultSettings,
      displayName: "Test",
      defaultThemeName: "tealTheme",
      useBoost: true,
    });
  });

  it("resets settings a preset leaves out to their defaults", () => {
    expect(defaultSettings.useCards).toBe(false);
    const resolved = resolvePresetSettings({
      ...defaultSettings,
      useCards: undefined,
    });
    expect(resolved.useCards).toBe(false);
  });

  it("drops anything that isn't part of a preset", () => {
    const resolved = resolvePresetSettings({
      ...defaultSettings,
      firstRun: false,
      systemPreset: "somethingElse",
    } as PresetV1);
    expect(resolved).toEqual(defaultSettings);
  });

  it("keeps the preset's values over the defaults", () => {
    const resolved = resolvePresetSettings({
      ...defaultSettings,
      useCards: true,
      longNotes: ["Mine"],
    });
    expect(resolved.useCards).toBe(true);
    expect(resolved.longNotes).toEqual(["Mine"]);
  });
});
