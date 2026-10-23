import { systemId, usageStatsEndpoint } from "../constants";
import { getTranslated } from "../functions/getTranslated";
import { basePresets } from "../presets";
import { settings } from "../settings/settings";
import { baseThemes } from "../themes/baseThemes";
import {
  offerUsageStats,
  registerUsageStatsSettings,
  sendUsageStatsIfDue,
  type UsageStatsConfig,
} from "../usageStats/usageStats";
import { askAboutUsageStats } from "../usageStats/usageStatsDialog";

/** The rules switches we report, to see which rules get used. */
const reportedSwitches = [
  "useBoost",
  "useCards",
  "useStabilityRules",
  "useSanityRules",
  "useBonds",
  "useTrauma",
  "useNetworkContacts",
  "useDamageApplication",
  "useLethalityAndAutofire",
  "useTurnPassingInitiative",
  "useMwStyleAbilities",
] as const;

/**
 * Which preset and theme the world uses, and which rules are on. Presets and
 * themes from elsewhere (modules, custom themes) are just "other": their names
 * are someone else's to share.
 */
export function getReportedSettings() {
  const preset = settings.systemPreset.get();
  const theme = settings.defaultThemeName.get();
  return {
    preset: Object.hasOwn(basePresets, preset) ? preset : "other",
    theme: Object.hasOwn(baseThemes, theme) ? theme : "other",
    ...Object.fromEntries(
      reportedSwitches.map((key) => [key, settings[key].get()]),
    ),
  };
}

export const usageStatsConfig: UsageStatsConfig = {
  packageId: systemId,
  endpoint: usageStatsEndpoint,
  getSettings: getReportedSettings,
  localize: (key, values = {}) =>
    getTranslated(key, {
      Settings: getTranslated("SystemNameSystemSettings", {
        SystemName: getTranslated("SystemName"),
      }),
      ...values,
    }),
};

/** Call in the `init` hook. */
export const registerUsageStats = () => {
  registerUsageStatsSettings(usageStatsConfig);
};

/**
 * Call in the `ready` hook. Asks the GM (once) whether to share usage stats,
 * then sends today's report if they do.
 */
export const runUsageStats = async () => {
  await offerUsageStats(usageStatsConfig, askAboutUsageStats);
  await sendUsageStatsIfDue(usageStatsConfig);
};
