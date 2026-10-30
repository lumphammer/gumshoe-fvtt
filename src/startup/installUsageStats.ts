import { systemId, usageStatsEndpoint } from "../constants";
import { getTranslated } from "../functions/getTranslated";
import { basePresets } from "../presets";
import { runtimeConfig } from "../runtime";
import { getSettingsDict } from "../settings/settings";
import { baseThemes } from "../themes/baseThemes";
import {
  offerUsageStats,
  registerUsageStatsSettings,
  sendUsageStatsIfDue,
  type UsageStatsConfig,
} from "../usageStats/usageStats";
import { askAboutUsageStats } from "../usageStats/usageStatsDialog";
import { buildReportedSettings } from "./reportedSettings";

/** The settings we report (see `buildReportedSettings`). */
export const getReportedSettings = () =>
  buildReportedSettings(getSettingsDict(), {
    basePresetIds: Object.keys(basePresets),
    baseThemeIds: Object.keys(baseThemes),
    runtime: runtimeConfig,
  });

/** The placeholders the usage stats strings can use. */
export const getUsageStatsTranslationValues = () => ({
  Settings: getTranslated("SystemNameSystemSettings", {
    SystemName: getTranslated("SystemName"),
  }),
  PackageTitle: getTranslated("SystemName"),
  PolicyURL:
    "https://github.com/lumphammer/gumshoe-fvtt/blob/main/STATS_POLICY.md",
});

export const usageStatsConfig: UsageStatsConfig = {
  packageId: systemId,
  endpoint: usageStatsEndpoint,
  getSettings: getReportedSettings,
  localize: (key, values = {}) =>
    getTranslated(key, { ...getUsageStatsTranslationValues(), ...values }),
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
