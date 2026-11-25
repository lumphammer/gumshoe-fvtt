import { settingsSaved } from "../constants";
import { assertGame } from "../functions/isGame";
import { runtimeConfig } from "../runtime";
import { resolvePresetSettings } from "../settings/resolvePresetSettings";
import { settings } from "../settings/settings";
import { applyPresetSettings, listKeys } from "./applyPresetSettings";

const applyPresetNow = async (presetId: string): Promise<void> => {
  assertGame(game);
  if (!game.user.isGM) {
    throw new Error("Only a Gamemaster can apply a preset");
  }
  if (!Object.hasOwn(runtimeConfig.presets, presetId)) {
    throw new Error(`No preset is installed with the id "${presetId}"`);
  }
  const preset = runtimeConfig.presets[presetId];
  // the types say so, but a module written in JS could install anything
  if ((preset.schemaVersion as unknown) !== "v1") {
    throw new Error(
      `Preset "${presetId}" has schemaVersion ${JSON.stringify(
        preset.schemaVersion,
      )}, but only "v1" is supported. No settings were changed.`,
    );
  }
  const resolved = resolvePresetSettings(preset);
  const keys = Object.keys(resolved).filter((key) =>
    Object.hasOwn(settings, key),
  );

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

  const written = await applyPresetSettings(resolved, keys);
  if (settings.systemPreset.get() !== presetId) {
    try {
      await settings.systemPreset.set(presetId);
    } catch (cause) {
      throw new Error(
        `Could not write setting "systemPreset". Settings written: ${listKeys(
          written,
        )}.`,
        { cause },
      );
    }
  }
  // as the settings window does after saving (e.g. to show or hide the
  // alternative item type)
  Hooks.call(settingsSaved);
};

let queue: Promise<unknown> = Promise.resolve();

/**
 * Apply an installed preset to the world, as choosing it in the system
 * settings and saving would: every setting a preset controls is written,
 * those it leaves out getting their defaults, and it becomes the world's
 * preset. Every value is checked first: if any is invalid, nothing is written.
 *
 * Exposed to modules as `CONFIG.Investigator.applyPreset`.
 *
 * Calls run one at a time: each works out what to change from the current
 * settings, so two at once could each skip a write the other is about to
 * undo.
 */
export const applyPreset = (presetId: string): Promise<void> => {
  const result = queue.then(() => applyPresetNow(presetId));
  queue = result.catch(() => undefined);
  return result;
};
