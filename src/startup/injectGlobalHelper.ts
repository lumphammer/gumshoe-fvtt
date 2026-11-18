import type {
  PresetV1,
  ThemeSeedV1,
  ThemeV2,
} from "@lumphammer/investigator-fvtt-types";

import * as constants from "../constants";
import { getCallingModuleId } from "../functions/getCallingModuleId";
import { assertNotNull } from "../functions/utilities";
import { runtimeConfig, type InstallSource } from "../runtime";
import { themeFromV1 } from "../themes/catalogue/fromV1";
import { themeFactory } from "../themes/functions";
import { type Theme, validateThemeV2 } from "../themes/theme";

/**
 * A theme, V1 or V2 (by its `schemaVersion`), as a theme. A V2 theme from
 * anywhere but our own code is checked first: an error says what's wrong
 * with it.
 */
export function resolveTheme(theme: ThemeSeedV1 | ThemeV2): Theme {
  const version = (theme as { schemaVersion?: unknown } | null)?.schemaVersion;
  if (version === "v1") return themeFromV1(themeFactory(theme as ThemeSeedV1));
  return validateThemeV2(theme);
}

function setSource(
  sources: Record<string, InstallSource>,
  id: string,
  source: InstallSource | undefined,
) {
  if (source) {
    sources[id] = source;
  } else {
    delete sources[id];
  }
}

/** The module calling the code that calls this, if any. */
function getCallerSource(): InstallSource | undefined {
  const moduleId = getCallingModuleId(new Error().stack);
  return moduleId ? { type: "module", id: moduleId } : undefined;
}

/**
 * Install a theme, V1 or V2, noting where it came from (for usage stats). A
 * V2 theme that isn't one is refused, with an error that says why.
 */
export const installTheme = (
  id: string,
  theme: ThemeSeedV1 | ThemeV2,
  source: InstallSource | undefined,
) => {
  runtimeConfig.themes[id] = resolveTheme(theme);
  setSource(runtimeConfig.themeSources, id, source);
  Hooks.callAll(constants.runtimeConfigChanged);
};

export const injectGlobalHelper = () => {
  CONFIG.Investigator = {
    installTheme: (id: string, theme: ThemeSeedV1 | ThemeV2) => {
      assertNotNull(CONFIG.Investigator, "CONFIG.Investigator");
      installTheme(id, theme, getCallerSource());
    },
    installPreset: (id: string, preset: PresetV1) => {
      assertNotNull(CONFIG.Investigator, "CONFIG.Investigator");
      runtimeConfig.presets[id] = preset;
      setSource(runtimeConfig.presetSources, id, getCallerSource());
      Hooks.callAll(constants.runtimeConfigChanged);
    },
  };
};
