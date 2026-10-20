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
 */
export const applyPresetSettings = async (
  preset: PresetV1,
  keys: readonly string[] = Object.keys(preset).filter(
    (key) => key in settings,
  ),
) => {
  const changes = getPresetSettingChanges(preset, keys, getSettingsDict());
  await Promise.all(
    Object.entries(changes).map(([key, value]) =>
      (settings as unknown as WritableSettings)[key].set(value),
    ),
  );
};
