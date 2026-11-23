import type {
  ThemePalette,
  ThemeV2,
} from "@lumphammer/investigator-fvtt-types";

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
import { cthulhuByCandlelightTheme } from "./cthulhuByCandlelightTheme";
import type { ThemeV1 } from "./types";

// The themes that are still V1, converted here until each gets its makeover.
// Their polarity is given, as it's measured in a browser (`polarityOf`), and
// this also runs in Node (tests, scripts).
const v1Themes: { [themeName: string]: [ThemeV1, ThemePalette["polarity"]] } = {
  fearTheme: [fearTheme, "light"],
  deltaGroovyTheme: [deltaGroovyTheme, "light"],
  antiquarianTheme: [antiquarianTheme, "light"],
  unsafeRealityTheme: [unsafeRealityTheme, "dark"],
  mutantCityBlueTheme: [mutantCityBlueTheme, "light"],
};

// remember to update the HMR setup below any time you modify this export.
export const baseThemes: { [themeName: string]: ThemeV2 } = {
  tealTheme,
  cthulhuByCandlelightTheme,
  niceTheme,
  niceThemeDark,
  olderThanMemoryTheme,
  highContrastTheme,
  greenTriangleTheme,
  pallidTheme,
  ...Object.fromEntries(
    Object.entries(v1Themes).map(([id, [theme, polarity]]) => [
      id,
      themeFromV1(theme, polarity),
    ]),
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
        "./cthulhuByCandlelightTheme.ts",
        "./niceTheme.ts",
        "./niceThemeDark.ts",
        "./olderThanMemoryTheme.ts",
        "./highContrastTheme.ts",
        "./greenTriangleTheme.ts",
        "./pallidTheme.ts",
        "./fearTheme.ts",
        "./deltaGroovyTheme.ts",
        "./antiquarianTheme.ts",
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
