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
 * Whether to ask the GM on startup. Off for now: GMs can still opt in from
 * the settings.
 */
const askOnStartup: boolean = false;

/**
 * Call in the `ready` hook. Asks the GM (once) whether to share usage stats
 * (when `askOnStartup` is on), then sends today's report if they do.
 */
export const runUsageStats = async () => {
  if (askOnStartup) {
    await offerUsageStats(usageStatsConfig, askAboutUsageStats);
  }
  await sendUsageStatsIfDue(usageStatsConfig);
};
