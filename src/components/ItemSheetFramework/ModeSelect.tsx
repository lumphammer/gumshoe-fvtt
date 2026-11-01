import type { PropsWithChildren } from "react";
import { useContext } from "react";

import { ModeContext } from "./modeContext";
import type { ItemSheetMode } from "./types";
type ModeSelectProps = PropsWithChildren<{
  mode: ItemSheetMode;
}>;

export const ModeSelect = ({ mode, children }: ModeSelectProps) => {
  "use memo";

  const currentMode = useContext(ModeContext);
  return mode === currentMode ? <>{children}</> : null;
};

ModeSelect.displayName = "ModeSelect";
