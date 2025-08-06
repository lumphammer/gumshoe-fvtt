import React, { useContext } from "react";

import { ThemeContext } from "../../themes/ThemeContext";
import { IdContext } from "../IdContext";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  title?: string;
};

/**
 * A custom checkbox which uses a label to make it accessible
 *
 * Inspired by https://jsfiddle.net/maxshuty/2cs0dj54/
 */
export const Checkbox = React.memo<CheckboxProps>(
  ({ checked, onChange, className, title }) => {
    const id = useContext(IdContext);
    const theme = useContext(ThemeContext);

    return (
      <label
        title={title}
        css={{
          display: "inline-block",
          position: "relative",
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          css={{
            position: "absolute",
            opacity: 0,
            zIndex: -1,
          }}
          onChange={(e) => {
            onChange(e.currentTarget.checked);
          }}
        />
        <span
          className={className}
          css={{
            cursor: "pointer",
            font: "16px sans-serif",
            color: "black",
            ":before": {
              content: "''",
              borderWidth: "2px",
              borderColor: "#ccc",
              borderStyle: "inset",
              borderRadius: "5px",
              display: "inline-block",
              width: "1.1em",
              height: "1.1em",
              aspectRatio: "1 / 1",
              verticalAlign: "-2px",
              backgroundColor: theme.colors.accentContrast,
            },
            "input[type=checkbox]:checked+&:before": {
              // backgroundColor: theme.colors.accent,
              color: theme.colors.accentContrast,
              textAlign: "center",
              verticalAlign: "middle",
            },
            "input[type=checkbox]:checked+&:after": {
              content: "'✓'",
              fontWeight: "bold",
              color: theme.colors.accent,
              position: "absolute",
              top: "0em",
              left: "0.3em",
            },
            "input[type=checkbox]:focus+&:before, input[type=checkbox]:not(:disabled)+&:hover:before":
              {
                boxShadow: `0px 0px 0px 2px ${theme.colors.glow}`,
                outlineColor: "transparent",
                outlineWidth: "2px",
                outlineStyle: "dotted",
              },
            "input[type=checkbox]:disabled+&": {
              cursor: "default",
              color: "black",
              opacity: "0.5",
            },
          }}
        />
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
