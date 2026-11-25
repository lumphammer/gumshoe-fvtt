import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";

import { defaultSettings } from "../presets";

/**
 * Every setting a preset controls: the preset's own values, over
 * `defaultSettings` for anything it leaves out. Applying a preset must reset
 * what it doesn't mention, or settings from the last preset (or ones added to
 * the system since the preset was written) would carry over.
 *
 * Only `PresetV1`'s keys are taken from the preset: anything else on the
 * object (a module might build its preset from an exported settings dict) is
 * dropped, so a preset can't write settings like `firstRun` or `systemPreset`.
 */
export const resolvePresetSettings = (preset: PresetV1): Required<PresetV1> =>
  Object.fromEntries(
    Object.entries(defaultSettings).map(([key, defaultValue]) => {
      const value: unknown = Object.hasOwn(preset, key)
        ? preset[key as keyof PresetV1]
        : undefined;
      // a key that's there but `undefined` means "not set", like a missing one
      return [key, value === undefined ? defaultValue : value];
    }),
  ) as Required<PresetV1>;
