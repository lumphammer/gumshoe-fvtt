import type {
  PresetV1,
  ThemeSeedV1,
} from "@lumphammer/investigator-fvtt-types";

import { getCallingModuleId } from "../functions/getCallingModuleId";
import { assertNotNull } from "../functions/utilities";
import { runtimeConfig, type InstallSource } from "../runtime";
import { themeFactory } from "../themes/functions";

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

/** Install a theme, noting where it came from (for usage stats). */
export const installTheme = (
  id: string,
  seed: ThemeSeedV1,
  source: InstallSource | undefined,
) => {
  runtimeConfig.themes[id] = themeFactory(seed);
  setSource(runtimeConfig.themeSources, id, source);
};

export const injectGlobalHelper = () => {
  CONFIG.Investigator = {
    installTheme: (id: string, seed: ThemeSeedV1) => {
      assertNotNull(CONFIG.Investigator, "CONFIG.Investigator");
      installTheme(id, seed, getCallerSource());
    },
    installPreset: (id: string, preset: PresetV1) => {
      assertNotNull(CONFIG.Investigator, "CONFIG.Investigator");
      runtimeConfig.presets[id] = preset;
      setSource(runtimeConfig.presetSources, id, getCallerSource());
    },
  };
};
