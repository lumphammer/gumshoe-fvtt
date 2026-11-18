import type { PropsWithChildren } from "react";
import { FaTriangleExclamation, FaCircleInfo } from "react-icons/fa6";

import { callout } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

/**
 * A short explanatory note at the top of a settings page, for things people
 * need to know before they start changing stuff.
 */
export const SettingsNote = ({
  children,
  mode = "warn",
}: PropsWithChildren<{ mode?: "warn" | "info" }>) => {
  const Icon = mode === "warn" ? FaTriangleExclamation : FaCircleInfo;

  return (
    <div
      role="note"
      className={cx(
        callout({ tone: mode === "warn" ? "warning" : "info" }),
        css({
          alignItems: "baseline",
          padding: "0.5em",
          marginBottom: "0.5em",
        }),
      )}
    >
      <Icon className={css({ flex: "[0 0 auto]" })} />
      <div>{children}</div>
    </div>
  );
};

SettingsNote.displayName = "SettingsNote";
