import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";

import { getPresetSettingChanges } from "../settings/getPresetSettingChanges";
import { getSettingsDict, settings } from "../settings/settings";

type WritableSettings = Record<
  string,
  { set: (value: unknown) => Promise<unknown> }
>;

/**
 * Write a preset's values for `keys` (by default, every setting it sets) into
 * the world's settings.
 *
 * The writes go out together (each is a socket round trip). If any fail, this
 * waits for the rest to finish, then throws, saying which were written and
 * which weren't: a failed write can't be rolled back.
 */
export const applyPresetSettings = async (
  preset: PresetV1,
  keys: readonly string[] = Object.keys(preset).filter((key) =>
    Object.hasOwn(settings, key),
  ),
) => {
  const changes = Object.entries(
    getPresetSettingChanges(preset, keys, getSettingsDict()),
  );
  const results = await Promise.allSettled(
    changes.map(([key, value]) =>
      (settings as unknown as WritableSettings)[key].set(value),
    ),
  );
  const failed = changes.filter((_, i) => results[i].status === "rejected");
  if (failed.length > 0) {
    const written = changes.filter((_, i) => results[i].status === "fulfilled");
    const list = (entries: typeof changes) =>
      entries.map(([key]) => `"${key}"`).join(", ") || "none";
    throw new Error(
      `Could not write settings ${list(failed)}. Settings written: ${list(
        written,
      )}.`,
      {
        cause: (
          results.find(({ status }) => status === "rejected") as
            | PromiseRejectedResult
            | undefined
        )?.reason,
      },
    );
  }
};
