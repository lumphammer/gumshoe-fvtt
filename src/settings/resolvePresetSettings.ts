import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";

import { defaultSettings } from "../presets";

/**
 * Every setting a preset controls: the preset's own values, over
 * `defaultSettings` for anything it leaves out. Applying a preset must reset
 * what it doesn't mention, or settings from the last preset (or ones added to
 * the system since the preset was written) would carry over.
 */
export const resolvePresetSettings = (
  preset: PresetV1,
): Required<PresetV1> => ({
  ...defaultSettings,
  // a key that's there but `undefined` means "not set", like a missing one
  ...Object.fromEntries(
    Object.entries(preset).filter(([, value]) => value !== undefined),
  ),
});
