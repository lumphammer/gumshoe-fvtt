import * as Switch from "@radix-ui/react-switch";
import { memo, useContext } from "react";

import { systemLogger } from "../../functions/utilities";
import { useIsEditable } from "../../hooks/useIsEditable";
import { cx } from "../../styled-system/css";
import { toggle } from "../../styled-system/recipes";
import { IdContext } from "../IdContext";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  /** For screen readers and tooltips, when there's no `<label>` for it */
  label?: string;
  /**
   * Usable even when the user can't edit the document, for toggles which
   * only change what's shown (like edit mode)
   */
  alwaysEnabled?: boolean;
};

/** An on/off switch (the catalogue's `toggle`). */
export const Toggle = memo<ToggleProps>(
  ({
    checked,
    onChange,
    className,
    label,
    alwaysEnabled = false,
  }: ToggleProps) => {
    const id = useContext(IdContext);
    const isEditable = useIsEditable();
    const classes = toggle();
    return (
      <Switch.Root
        id={id}
        aria-label={label}
        title={label}
        disabled={!isEditable && !alwaysEnabled}
        data-interactive
        className={cx(classes.track, className)}
        checked={checked}
        onCheckedChange={(e) => {
          systemLogger.log("checked", e);
          onChange(e);
        }}
      >
        <Switch.Thumb className={classes.thumb} />
      </Switch.Root>
    );
  },
);

Toggle.displayName = "Toggle";
