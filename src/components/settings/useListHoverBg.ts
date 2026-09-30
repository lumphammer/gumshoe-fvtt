import { useContext, useMemo } from "react";

import { irid } from "../../irid/irid";
import { ThemeContext } from "../../themes/ThemeContext";

/**
 * Background colour for hovered rows in settings lists and menus. It's
 * translucent so it shows up against whatever is behind the list, be it a
 * textured backdrop or a flat panel.
 */
export const useListHoverBg = () => {
  const theme = useContext(ThemeContext);
  return useMemo(
    () => irid(theme.colors.glow).opacity(0.25).toString(),
    [theme.colors.glow],
  );
};
