import type { ThemeV1 } from "../types";
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

/**
 * The built-in themes as they were in V1: what the V2 ones (in
 * `src/themes`) were printed from (`pnpm print:theme-v2`), and V1 themes for
 * tests of the V1 path. Nothing installs them.
 */
export const v1BaseThemes: Record<string, ThemeV1> = {
  tealTheme,
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
