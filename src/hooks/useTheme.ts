import { useEffect, useState } from "react";

import * as constants from "../constants";
import { runtimeConfig } from "../runtime";
import { settings } from "../settings/settings";
import { tealTheme } from "../themes/tealTheme";
import { ThemeV1 } from "../themes/types";
import { useRefStash } from "./useRefStash";

function getThemeByName(name: string | null) {
  const nameOrDefault = name ?? settings.defaultThemeName.get();
  const theme = runtimeConfig.themes[nameOrDefault] ?? tealTheme;
  return theme;
}

/**
 * This is the new right way to get a theme from a theme name. It will return a
 * default theme in the event of an error, and will also update the theme if it
 * changes in dev using HMR (see baseThemes.ts for where that gets initiated.)
 */
export const useTheme = (name: string | null = null) => {
  const [theme, setTheme] = useState<ThemeV1>(getThemeByName(name));
  const [prevThemeName, setPrevThemeName] = useState<string | null>(name);

  const themeNameRef = useRefStash(name);

  if (prevThemeName !== name) {
    setPrevThemeName(name);
    setTheme(getThemeByName(name));
  }

  useEffect(() => {
    const handleThemeHMR = (updatedThemeName: string) => {
      if (updatedThemeName === themeNameRef.current) {
        setTheme(getThemeByName(updatedThemeName));
      }
    };
    Hooks.on(constants.themeHMR, handleThemeHMR);
    return () => {
      Hooks.off(constants.themeHMR, handleThemeHMR);
    };
  }, [themeNameRef]);
  return theme;
};
