import React, { useContext } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { css, cx } from "../../styled-system/css";
import { checkbox } from "../../styled-system/recipes";
import { IdContext } from "../IdContext";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  title?: string;
};

/**
 * A custom checkbox (the catalogue's `checkbox`) which uses a label to make it
 * accessible: the real input is hidden, and the box after it stands for it.
 *
 * Inspired by https://jsfiddle.net/maxshuty/2cs0dj54/
 */
export const Checkbox = React.memo<CheckboxProps>(
  ({ checked, onChange, className, title }) => {
    const id = useContext(IdContext);
    const isEditable = useIsEditable();
    const classes = checkbox();

    return (
      <label
        title={title}
        className={css({ display: "inline-block", position: "relative" })}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={!isEditable}
          className={css({ position: "absolute", opacity: 0, zIndex: -1 })}
          onChange={(e) => {
            onChange(e.currentTarget.checked);
          }}
        />
        {/* clickable, on the box itself, so a theme's `checkbox` states
          (hover) are on what has them */}
        <span
          data-interactive
          data-disabled={!isEditable || undefined}
          className={cx(classes.box, className)}
        >
          {/* an icon, not a ✓, so it isn't part of the label's text */}
          <i className={cx(classes.tick, "fas fa-check")} aria-hidden="true" />
        </span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
