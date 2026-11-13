import type { ThemeV2 } from "@lumphammer/investigator-fvtt-types";

import * as constants from "../constants";
import { themeFromV1 } from "./catalogue/fromV1";
import { antiquarianTheme } from "./antiquarianTheme";
import { deltaGroovyTheme } from "./deltaGroovyTheme";
import { fearTheme } from "./fearTheme";
import { greenTriangleTheme } from "./greenTriangleTheme";
import { highContrastTheme } from "./highContrastTheme";
import { mutantCityBlueTheme } from "./mutantCityBlueTheme";
import { niceTheme } from "./niceTheme";
import { niceThemeDark } from "./niceThemeDark";
import { olderThanMemoryTheme } from "./olderThanMemoryTheme";
import { pallidTheme } from "./pallidTheme";
import { tealTheme } from "./tealTheme";
import { unsafeRealityTheme } from "./unsafeRealityTheme";
import { fogTheme } from "./fogTheme";
import { nightFogTheme } from "./nightFogTheme";
import type { ThemeV1 } from "./types";

// The themes that are still V1, converted here until each gets its makeover.
const v1Themes: { [themeName: string]: ThemeV1 } = {
  niceTheme,
  niceThemeDark,
  highContrastTheme,
  fearTheme,
  pallidTheme,
  deltaGroovyTheme,
  greenTriangleTheme,
  antiquarianTheme,
  olderThanMemoryTheme,
  unsafeRealityTheme,
  mutantCityBlueTheme,
};

// remember to update the HMR setup below any time you modify this export.
export const baseThemes: { [themeName: string]: ThemeV2 } = {
  tealTheme,
  ...Object.fromEntries(
    Object.entries(v1Themes).map(([id, theme]) => [id, themeFromV1(theme)]),
  ),
  fogTheme,
  nightFogTheme,
};

export const reregisterBaseTheme = (name: string, theme: ThemeV2) => {
  baseThemes[name] = theme;
};

// HMR for themes
// we can only trigger HMR from the module that directly imports the module
// being replaced. we call CONFIG.Investigator?.installTheme to replace it in
// runtime config and then call a (Foundry) hook to notify the (React) useTheme
// hook about the change.
if (import.meta.hot) {
  const themeNames = Object.keys(baseThemes);

  if (import.meta.hot) {
    import.meta.hot.accept(
      [
        "./tealTheme.ts",
        "./niceTheme.ts",
        "./niceThemeDark.ts",
        "./highContrastTheme.ts",
        "./fearTheme.ts",
        "./pallidTheme.ts",
        "./deltaGroovyTheme.ts",
        "./greenTriangleTheme.ts",
        "./antiquarianTheme.ts",
        "./olderThanMemoryTheme.ts",
        "./unsafeRealityTheme.ts",
        "./mutantCityBlueTheme.ts",
        "./fogTheme.ts",
        "./nightFogTheme.ts",
      ],
      // keep this list in sync with the exports above.
      // unfortunately the HMR API is staticaly analysed so we can't do anything
      // clever - this *must* be a string literal array in the source code.
      // also this comment should be above the list, but doing so breaks said
      // static analysis.
      (newModules) => {
        newModules.forEach((newModule, i) => {
          if (newModule) {
            const themeName = themeNames[i];
            CONFIG.Investigator?.installTheme(themeName, newModule[themeName]);
            Hooks.call(constants.themeHMR, themeName);
          }
        });
      },
    );
  }
}
