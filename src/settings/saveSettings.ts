interface SettingsFormSetting {
  managedBySettingsForm: boolean;
  set: (value: any) => Promise<unknown>;
  validator?: {
    parse: (value: unknown) => unknown;
  };
}

const listKeys = (keys: string[]) => keys.map((key) => `"${key}"`).join(", ");

export class SettingsSaveError extends Error {
  constructor(
    readonly phase: "validation" | "write",
    readonly failedSettingKeys: string[],
    readonly savedSettingKeys: string[],
    cause: unknown,
  ) {
    super(
      `Could not ${phase === "validation" ? "validate" : "save"} setting${
        failedSettingKeys.length === 1 ? "" : "s"
      } ${listKeys(failedSettingKeys)}`,
      { cause },
    );
    this.name = "SettingsSaveError";
  }
}

/**
 * Validate the complete form draft, then write every form-managed setting.
 *
 * Each write is its own world-scoped document update, i.e. a socket round trip,
 * and there are enough of them that doing them in series is a visible delay on
 * a remote server - so they go out together. Settings are independent, with no
 * cross-setting invariant for a partial save to violate, but that does mean a
 * failed save can't be made atomic. The thrown error therefore records exactly
 * which settings were written and which weren't.
 */
export const saveSettings = async (
  draft: Record<string, unknown>,
  settingDefinitions: Record<string, SettingsFormSetting>,
): Promise<void> => {
  const entries = Object.entries(settingDefinitions).filter(
    ([, setting]) => setting.managedBySettingsForm,
  );

  // validate everything up front, so an invalid draft writes nothing at all
  const invalid = entries.flatMap(([key, setting]) => {
    try {
      setting.validator?.parse(draft[key]);
      return [];
    } catch (cause) {
      return [{ key, cause }];
    }
  });
  if (invalid.length > 0) {
    throw new SettingsSaveError(
      "validation",
      invalid.map(({ key }) => key),
      [],
      invalid[0].cause,
    );
  }

  const results = await Promise.allSettled(
    entries.map(([key, setting]) => setting.set(draft[key])),
  );
  const failed = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ key: entries[index][0], cause: result.reason }]
      : [],
  );
  if (failed.length > 0) {
    throw new SettingsSaveError(
      "write",
      failed.map(({ key }) => key),
      entries
        .filter((_, index) => results[index].status === "fulfilled")
        .map(([key]) => key),
      failed[0].cause,
    );
  }
};

export const getSettingsSaveErrorMessage = (error: SettingsSaveError) => {
  const { failedSettingKeys: failed, savedSettingKeys: saved, phase } = error;

  if (phase === "validation") {
    return `Could not save settings: ${listKeys(failed)} ${
      failed.length === 1 ? "is" : "are"
    } invalid. No settings were changed.`;
  }

  const savedMessage =
    saved.length === 0
      ? "No other settings were saved."
      : `${saved.length} other ${
          saved.length === 1 ? "setting was" : "settings were"
        } saved; review your changes before trying again.`;
  return `Could not save setting${failed.length === 1 ? "" : "s"} ${listKeys(
    failed,
  )}. ${savedMessage}`;
};
