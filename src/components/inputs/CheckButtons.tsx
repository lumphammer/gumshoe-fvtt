import { nanoid } from "nanoid";
import React, { Fragment, useCallback, useContext, useMemo } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { css, cx } from "../../styled-system/css";
import { button } from "../../styled-system/recipes";
import { IdContext, labelIdFor } from "../IdContext";

type CheckButtonsProps = {
  options: Array<{
    label: string;
    value: number;
    enabled: boolean;
    hover?: string;
  }>;
  selected: number;
  size?: number;
  onChange: (newValue: number) => void;
};

export const CheckButtons = ({
  options,
  selected,
  size = 1.4,
  onChange: onChangeOrig,
}: CheckButtonsProps) => {
  const isEditable = useIsEditable();
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.currentTarget.value);
      onChangeOrig(newValue);
    },
    [onChangeOrig],
  );

  const radioGroup = useMemo(() => nanoid(), []);
  const fieldId = useContext(IdContext);

  return (
    <div
      role="radiogroup"
      // named by the field it's in (a `GridField`'s label)
      aria-labelledby={fieldId ? labelIdFor(fieldId) : undefined}
      className={css({
        display: "flex",
        flexDirection: "row",
        gap: "0.3em",
        position: "relative",
        // hidden visually, but still focusable, so the group works from the
        // keyboard (tab in, arrow keys to change); the focusRing shows on
        // the label after it
        "& input[type=radio]": {
          position: "absolute",
          opacity: 0,
          width: "1px",
          height: "1px",
          margin: "0",
          pointerEvents: "none",
        },
      })}
      style={{ lineHeight: size }}
    >
      {options.map(({ label, value, enabled, hover }) => {
        const id = nanoid();
        return (
          <Fragment key={value}>
            <input
              name={radioGroup}
              id={id}
              type="radio"
              value={value}
              checked={value === selected}
              onChange={onChange}
              disabled={!enabled || !isEditable}
            />
            {/* a toolbar button each, pressed when it's the one chosen */}
            <label
              htmlFor={id}
              title={hover}
              data-interactive
              data-pressed={value === selected || undefined}
              data-disabled={!enabled || !isEditable || undefined}
              className={cx(
                button({ kind: "toolbar" }),
                css({ flex: "1", textAlign: "center", fontWeight: "bold" }),
              )}
              style={{ fontSize: `${size}em` }}
            >
              {label}
            </label>
          </Fragment>
        );
      })}
    </div>
  );
};
