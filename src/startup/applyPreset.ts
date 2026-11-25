import { assertGame } from "../functions/isGame";
import { runtimeConfig } from "../runtime";
import { resolvePresetSettings } from "../settings/resolvePresetSettings";
import { settings } from "../settings/settings";
import { applyPresetSettings } from "./applyPresetSettings";

/**
 * Apply an installed preset to the world, as choosing it in the system
 * settings and saving would: every setting a preset controls is written,
 * those it leaves out getting their defaults, and it becomes the world's
 * preset. Every value is checked first: if any is invalid, nothing is written.
 *
 * Exposed to modules as `CONFIG.Investigator.applyPreset`.
 */
export const applyPreset = async (presetId: string): Promise<void> => {
  assertGame(game);
  if (!game.user.isGM) {
    throw new Error("Only a Gamemaster can apply a preset");
  }
  if (!Object.hasOwn(runtimeConfig.presets, presetId)) {
    throw new Error(`No preset is installed with the id "${presetId}"`);
  }
  const resolved = resolvePresetSettings(runtimeConfig.presets[presetId]);
  const keys = Object.keys(resolved).filter((key) => key in settings);

  const invalid = keys.filter((key) => {
    const value: unknown = resolved[key as keyof typeof resolved];
    const { validator } = settings[key as keyof typeof settings];
    return validator !== undefined && !validator.safeParse(value).success;
  });
  if (invalid.length > 0) {
    throw new Error(
      `Preset "${presetId}" has invalid values for ${invalid
        .map((key) => `"${key}"`)
        .join(", ")}. No settings were changed.`,
    );
  }

  await applyPresetSettings(resolved, keys);
  if (settings.systemPreset.get() !== presetId) {
    await settings.systemPreset.set(presetId);
  }
};
