import type { PropsWithChildren } from "react";
import { useContext } from "react";
import { FaTriangleExclamation, FaCircleInfo } from "react-icons/fa6";

import { ThemeContext } from "../../themes/ThemeContext";

/**
 * A short explanatory note at the top of a settings page, for things people
 * need to know before they start changing stuff.
 */
export const SettingsNote = ({
  children,
  mode = "warn",
}: PropsWithChildren<{ mode?: "warn" | "info" }>) => {
  const theme = useContext(ThemeContext);

  const Icon = mode === "warn" ? FaTriangleExclamation : FaCircleInfo;

  return (
    <div
      role="note"
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "baseline",
        gap: "0.5em",
        padding: "0.5em",
        marginBottom: "0.5em",
        borderLeft: `3px solid ${theme.colors.accent}`,
        background: theme.colors.backgroundSecondary,
      }}
    >
      <Icon css={{ flex: "0 0 auto", color: theme.colors.accent }} />
      <div>{children}</div>
    </div>
  );
};

SettingsNote.displayName = "SettingsNote";
