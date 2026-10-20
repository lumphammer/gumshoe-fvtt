import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";

/**
 * The settings among `keys` which `preset` sets to something other than their
 * `current` value. Each setting is its own write (a socket round trip), so we
 * skip the ones which wouldn't change.
 */
export const getPresetSettingChanges = (
  preset: Partial<PresetV1>,
  keys: readonly string[],
  current: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    keys.flatMap((key) => {
      const value: unknown = preset[key as keyof PresetV1];
      return value === undefined ||
        JSON.stringify(value) === JSON.stringify(current[key])
        ? []
        : [[key, value]];
    }),
  );
