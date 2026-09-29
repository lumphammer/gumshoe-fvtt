import type { SettingsDict } from "./settings";
import { settings } from "./settings";

type settingsKey = keyof typeof settings;

export function getExportableSettingsDict(
  settingsDict: SettingsDict,
): Partial<SettingsDict> {
  const filteredEntries = Object.entries(settingsDict).filter(
    ([key]) => settings[key as settingsKey]?.exportable ?? false,
  );
  return Object.fromEntries(filteredEntries);
}
