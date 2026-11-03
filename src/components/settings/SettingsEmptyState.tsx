import { useContext } from "react";

import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";

/**
 * Stands in for a list with nothing in it.
 */
export const SettingsEmptyState = ({ message }: { message: string }) => {
  const theme = useContext(ThemeContext);
  return (
    <div
      css={{
        padding: "1.5em 1em",
        border: `1px dashed ${theme.colors.controlBorder}`,
        borderRadius: "0.3em",
        textAlign: "center",
        fontStyle: "italic",
        opacity: 0.75,
      }}
    >
      <Translate>{message}</Translate>
    </div>
  );
};

SettingsEmptyState.displayName = "SettingsEmptyState";
