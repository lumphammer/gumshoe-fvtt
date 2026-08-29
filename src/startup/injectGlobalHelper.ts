import { PresetV1, ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";

import { assertNotNull } from "../functions/utilities";
import { runtimeConfig } from "../runtime";
import { themeFactory } from "../themes/functions";

export const injectGlobalHelper = () => {
  CONFIG.Investigator = {
    installTheme: (id: string, seed: ThemeSeedV1) => {
      assertNotNull(CONFIG.Investigator, "CONFIG.Investigator");
      runtimeConfig.themes[id] = themeFactory(seed);
    },
    installPreset: (id: string, preset: PresetV1) => {
      assertNotNull(CONFIG.Investigator, "CONFIG.Investigator");
      runtimeConfig.presets[id] = preset;
    },
  };
};
