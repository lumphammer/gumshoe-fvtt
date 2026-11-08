import type { PresetV1 } from "@lumphammer/investigator-fvtt-types";

import { basePresets } from "./presets";
import { baseThemes } from "./themes/baseThemes";
import { type Theme, themeFromV1 } from "./themes/theme";

/**
 * Where an installed theme or preset came from: the custom themes folder, or a
 * module. Ours, and ones installed by anything else, have no source.
 */
export type InstallSource = { type: "local" } | { type: "module"; id: string };

export interface RuntimeConfig {
  themes: {
    [name: string]: Theme;
  };
  themeSources: {
    [name: string]: InstallSource;
  };
  presets: {
    [name: string]: PresetV1;
  };
  presetSources: {
    [name: string]: InstallSource;
  };
}

export const runtimeConfig: RuntimeConfig = {
  themes: Object.fromEntries(
    Object.entries(baseThemes).map(([id, theme]) => [id, themeFromV1(theme)]),
  ),
  themeSources: {},
  presets: { ...basePresets },
  presetSources: {},
};
