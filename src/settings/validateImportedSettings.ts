import { fromZodError } from "zod-validation-error/v4";

import type { SettingsDict } from "./settings";
import { superValidator } from "./settings";

/**
 * What a settings file can have that isn't a setting: its `$schema`, for
 * editors, and a preset's name and version, so a preset's file imports too.
 */
const ignoredKeys = ["$schema", "schemaVersion", "displayName"];

export function validateImportedSettings(rawText: string) {
  // if JSON parsing fails, we get an error straight from Node
  const parsed = JSON.parse(rawText);
  const candidateSettings =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.fromEntries(
          Object.entries(parsed).filter(([key]) => !ignoredKeys.includes(key)),
        )
      : parsed;

  // otherwise we try running it through Zod
  try {
    const newSettings: Partial<SettingsDict> =
      superValidator.parse(candidateSettings);
    return newSettings;
  } catch (e) {
    // if we're here we can be confident that the error was a Zod error, so we
    // can convert it into a more user-friendly error
    throw fromZodError(e as any);
  }
}
