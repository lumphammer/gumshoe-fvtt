import { idPattern } from "@lumphammer/fvtt-telemetry-schema";
import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";

import { defaultSettings } from "../presets";
import type { InstallSource, RuntimeConfig } from "../runtime";
import { getPresetSettingChanges } from "../settings/getPresetSettingChanges";
import type { SettingsDict } from "../settings/settings";

type BooleanSetting = {
  [K in keyof SettingsDict]: SettingsDict[K] extends boolean ? K : never;
}[keyof SettingsDict];

/**
 * The switches we report, each with the switch it sits under on the settings
 * pages. A switch is only reported when the one above it is on (and reported):
 * otherwise it's hidden, and its value says nothing.
 */
const reportedSwitches = {
  useBoost: null,
  useCards: null,
  useNetworkContacts: null,
  useNpcCombatBonuses: null,
  useTurnPassingInitiative: null,
  useExtendedRange: null,
  useWoundStatusEffects: null,
  useDamageApplication: null,
  useGunfireOnHumans: "useDamageApplication",
  useCriticalHits: "useDamageApplication",
  useLethalityAndAutofire: "useDamageApplication",
  useShotDryAndJams: "useLethalityAndAutofire",
  useWalkingFire: "useLethalityAndAutofire",
  useStabilityRules: null,
  useSanityRules: "useStabilityRules",
  useStabilityStates: "useStabilityRules",
  useBonds: "useStabilityRules",
  useTrauma: "useStabilityRules",
  useMwStyleAbilities: null,
  mwUseAlternativeItemTypes: null,
  useMwInjuryStatus: null,
  showEmptyInvestigativeCategories: null,
  notifyItemAddedToActor: null,
} satisfies Partial<Record<BooleanSetting, BooleanSetting | null>>;

type ReportedSwitch = keyof typeof reportedSwitches;

/**
 * The lists we report as `changed.<key>`: whether the world's list differs
 * from its preset's (never what's in it). Each has the switch it matters
 * under, if any, and is only reported when that switch is.
 */
const reportedLists = {
  investigativeAbilityCategories: null,
  generalAbilityCategories: null,
  combatAbilities: null,
  personalDetails: null,
  longNotes: null,
  newPCPacks: null,
  newNPCPacks: null,
  pcStats: null,
  npcStats: null,
  equipmentCategories: null,
  mwHiddenShortNotes: "useMwStyleAbilities",
  fullAutoSpendAbilities: "useLethalityAndAutofire",
  walkingFireSpendAbilities: "useWalkingFire",
  stabilityStates: "useStabilityStates",
  traumaTypes: "useTrauma",
  cardCategories: "useCards",
} satisfies Partial<Record<keyof PresetV1, ReportedSwitch | null>>;

type ReportedList = keyof typeof reportedLists;

export type ReportableSettings = Pick<
  SettingsDict,
  "systemPreset" | "defaultThemeName" | ReportedSwitch | ReportedList
>;

/** Longer IDs wouldn't fit in a setting value. */
const maxModuleIdLength = 64;

/**
 * Where the world's theme or preset came from, if it isn't one of ours, as
 * `<kind>Source` (and `<kind>Module`). A module's is named; one that isn't
 * installed now (its module is off, or its file is gone) is "missing".
 */
function getSource(
  kind: "theme" | "preset",
  id: string,
  installed: Record<string, unknown>,
  sources: Record<string, InstallSource>,
): Record<string, string> {
  const sourceKey = `${kind}Source`;
  if (!Object.hasOwn(installed, id)) return { [sourceKey]: "missing" };
  const source = sources[id];
  if (source?.type === "local") return { [sourceKey]: "local" };
  if (
    source?.type === "module" &&
    idPattern.test(source.id) &&
    source.id.length <= maxModuleIdLength
  ) {
    return { [sourceKey]: "module", [`${kind}Module`]: source.id };
  }
  return { [sourceKey]: "unknown" };
}

/**
 * The settings we report. Presets and themes from elsewhere are just "other":
 * their names are someone else's to share (except the module they came from,
 * whose ID is already in the report's module list).
 */
export function buildReportedSettings(
  settings: ReportableSettings,
  {
    basePresetIds,
    baseThemeIds,
    runtime,
  }: {
    basePresetIds: readonly string[];
    baseThemeIds: readonly string[];
    runtime: RuntimeConfig;
  },
): Record<string, string | boolean> {
  const preset = settings.systemPreset;
  const theme = settings.defaultThemeName;

  const isReported = (key: ReportedSwitch): boolean => {
    const parent: ReportedSwitch | null = reportedSwitches[key];
    return parent === null || (isReported(parent) && settings[parent]);
  };
  const isUnder = (key: ReportedSwitch | null) =>
    key === null || (isReported(key) && settings[key]);

  const switches = (Object.keys(reportedSwitches) as ReportedSwitch[])
    .filter(isReported)
    .map((key) => [key, settings[key]]);

  // without the preset, there's nothing to compare against
  const presetValues = runtime.presets[preset];
  const lists = (Object.keys(reportedLists) as ReportedList[]).filter((key) =>
    isUnder(reportedLists[key]),
  );
  const changed = presetValues
    ? getPresetSettingChanges(
        { ...defaultSettings, ...presetValues },
        lists,
        settings,
      )
    : {};
  const listsChanged = presetValues
    ? lists.map((key) => [`changed.${key}`, Object.hasOwn(changed, key)])
    : [];

  return {
    ...(basePresetIds.includes(preset)
      ? { preset }
      : {
          preset: "other",
          ...getSource(
            "preset",
            preset,
            runtime.presets,
            runtime.presetSources,
          ),
        }),
    ...(baseThemeIds.includes(theme)
      ? { theme }
      : {
          theme: "other",
          ...getSource("theme", theme, runtime.themes, runtime.themeSources),
        }),
    ...Object.fromEntries(switches),
    ...Object.fromEntries(listsChanged),
  };
}
