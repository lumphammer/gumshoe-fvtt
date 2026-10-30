import { describe, expect, it } from "vitest";

import {
  defaultSettings,
  fallOfDeltaGreenPreset,
  basePresets,
} from "../presets";
import type { RuntimeConfig } from "../runtime";
import { baseThemes } from "../themes/baseThemes";
import { tealTheme } from "../themes/tealTheme";
import {
  buildReportedSettings,
  type ReportableSettings,
} from "./reportedSettings";

const runtime: RuntimeConfig = {
  themes: {
    ...baseThemes,
    "worlds/x/themes/mine.json": tealTheme,
    fromModule: tealTheme,
    fromConsole: tealTheme,
  },
  themeSources: {
    "worlds/x/themes/mine.json": { type: "local" },
    fromModule: { type: "module", id: "my-themes" },
  },
  presets: {
    ...basePresets,
    modulePreset: fallOfDeltaGreenPreset,
    consolePreset: fallOfDeltaGreenPreset,
  },
  presetSources: { modulePreset: { type: "module", id: "my-presets" } },
};

const options = {
  basePresetIds: Object.keys(basePresets),
  baseThemeIds: Object.keys(baseThemes),
  runtime,
};

/** A world freshly set up with the Fall of DELTA GREEN preset. */
const deltaGreenWorld: ReportableSettings = {
  ...defaultSettings,
  ...fallOfDeltaGreenPreset,
  systemPreset: "fallOfDeltaGreenPreset",
  notifyItemAddedToActor: false,
};

const report = (overrides: Partial<ReportableSettings> = {}) =>
  buildReportedSettings({ ...deltaGreenWorld, ...overrides }, options);

describe("buildReportedSettings", () => {
  it("reports a world set up from a preset", () => {
    expect(report()).toMatchInlineSnapshot(`
      {
        "changed.combatAbilities": false,
        "changed.equipmentCategories": false,
        "changed.fullAutoSpendAbilities": false,
        "changed.generalAbilityCategories": false,
        "changed.investigativeAbilityCategories": false,
        "changed.longNotes": false,
        "changed.newNPCPacks": false,
        "changed.newPCPacks": false,
        "changed.npcStats": false,
        "changed.pcStats": false,
        "changed.personalDetails": false,
        "changed.stabilityStates": false,
        "changed.traumaTypes": false,
        "changed.walkingFireSpendAbilities": false,
        "mwUseAlternativeItemTypes": false,
        "notifyItemAddedToActor": false,
        "preset": "fallOfDeltaGreenPreset",
        "showEmptyInvestigativeCategories": true,
        "theme": "deltaGroovyTheme",
        "useBonds": true,
        "useBoost": false,
        "useCards": false,
        "useCriticalHits": true,
        "useDamageApplication": true,
        "useExtendedRange": true,
        "useGunfireOnHumans": true,
        "useLethalityAndAutofire": true,
        "useMwInjuryStatus": false,
        "useMwStyleAbilities": false,
        "useNetworkContacts": true,
        "useNpcCombatBonuses": false,
        "useSanityRules": true,
        "useShotDryAndJams": true,
        "useStabilityRules": true,
        "useStabilityStates": true,
        "useTrauma": true,
        "useTurnPassingInitiative": false,
        "useWalkingFire": true,
        "useWoundStatusEffects": true,
      }
    `);
  });

  it("leaves out switches and lists under a switch that's off", () => {
    const settings = report({
      useDamageApplication: false,
      useStabilityRules: false,
    });
    for (const key of [
      "useGunfireOnHumans",
      "useCriticalHits",
      "useLethalityAndAutofire",
      "useShotDryAndJams",
      "useWalkingFire",
      "useSanityRules",
      "useStabilityStates",
      "useBonds",
      "useTrauma",
      "changed.fullAutoSpendAbilities",
      "changed.walkingFireSpendAbilities",
      "changed.stabilityStates",
      "changed.traumaTypes",
    ]) {
      expect(settings).not.toHaveProperty([key]);
    }
    expect(settings).toMatchObject({
      useDamageApplication: false,
      useStabilityRules: false,
      "changed.equipmentCategories": false,
    });
  });

  it("notes which lists differ from the preset", () => {
    expect(
      report({
        equipmentCategories: {},
        longNotes: [...deltaGreenWorld.longNotes, "More notes"],
      }),
    ).toMatchObject({
      "changed.equipmentCategories": true,
      "changed.longNotes": true,
      "changed.personalDetails": false,
    });
  });

  it("compares against a module's preset, and names the module", () => {
    const settings = report({ systemPreset: "modulePreset" });
    expect(settings).toMatchObject({
      preset: "other",
      presetSource: "module",
      presetModule: "my-presets",
      "changed.equipmentCategories": false,
    });
  });

  it("doesn't name a preset installed by anything else", () => {
    const settings = report({ systemPreset: "consolePreset" });
    expect(settings).toMatchObject({
      preset: "other",
      presetSource: "unknown",
    });
    expect(settings).not.toHaveProperty("presetModule");
  });

  it("leaves out the lists when the preset isn't installed", () => {
    const settings = report({ systemPreset: "goneAway" });
    expect(settings).toMatchObject({
      preset: "other",
      presetSource: "missing",
    });
    expect(
      Object.keys(settings).filter((key) => key.startsWith("changed.")),
    ).toEqual([]);
  });

  it("says where a theme from elsewhere came from", () => {
    const theme = (defaultThemeName: string) => {
      const { theme, themeSource, themeModule } = report({ defaultThemeName });
      return { theme, themeSource, themeModule };
    };
    expect(theme("tealTheme")).toEqual({ theme: "tealTheme" });
    expect(theme("worlds/x/themes/mine.json")).toEqual({
      theme: "other",
      themeSource: "local",
    });
    expect(theme("fromModule")).toEqual({
      theme: "other",
      themeSource: "module",
      themeModule: "my-themes",
    });
    expect(theme("fromConsole")).toEqual({
      theme: "other",
      themeSource: "unknown",
    });
    expect(theme("uninstalled")).toEqual({
      theme: "other",
      themeSource: "missing",
    });
  });

  it("doesn't name a module whose ID wouldn't fit", () => {
    const settings = buildReportedSettings(
      { ...deltaGreenWorld, defaultThemeName: "long" },
      {
        ...options,
        runtime: {
          ...runtime,
          themeSources: { long: { type: "module", id: "x".repeat(65) } },
          themes: { ...runtime.themes, long: tealTheme },
        },
      },
    );
    expect(settings).toMatchObject({ themeSource: "unknown" });
    expect(settings).not.toHaveProperty("themeModule");
  });
});
