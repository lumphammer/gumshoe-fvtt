import { fromZodError } from "zod-validation-error/v4";

import { SettingsDict, superValidator } from "./settings";

export function validateImportedSettings(rawText: string) {
  // if JSON parsing fails, we get an error straight from Node
  const candidateSettings = JSON.parse(rawText);

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
