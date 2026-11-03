import { nanoid } from "nanoid";
import React, { Fragment, useCallback, useContext, useMemo } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { ThemeContext } from "../../themes/ThemeContext";

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
  const theme = useContext(ThemeContext);
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.currentTarget.value);
      onChangeOrig(newValue);
    },
    [onChangeOrig],
  );

  const radioGroup = useMemo(() => nanoid(), []);

  return (
    <div
      css={{
        display: "flex",
        flexDirection: "row",
        gap: "0.3em",
        lineHeight: size,
        position: "relative",
        "input[type=radio]": {
          // hidden visually, but still focusable, so the group works from the
          // keyboard (tab in, arrow keys to change)
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1,
          margin: 0,
          pointerEvents: "none",
          "+label": {
            padding: "0",
            flex: 1,
            textAlign: "center",
            fontSize: size.toString() + "em",
            fontWeight: "bold",
            border: "2px groove white",
            backgroundColor: theme.colors.backgroundPrimary,
            paddingBottom: "0.3em",
            borderRadius: "0.2em",
            ":hover": {
              textShadow: `0 0 0.3em ${theme.colors.glow}`,
            },
          },
          "&:focus-visible+label": {
            outline: `2px solid ${theme.colors.accent}`,
            outlineOffset: "1px",
          },
          "&:checked+label": {
            border: "2px inset white",
            backgroundColor: theme.colors.accent,
            color: theme.colors.accentContrast,
            textShadow: `0 0 0.3em ${theme.colors.glow}`,
          },
          "&[disabled]+label": {
            opacity: 0.3, //
            ":hover": {
              textShadow: "none",
            },
          },
        },
      }}
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
            <label htmlFor={id} title={hover}>
              {label}
            </label>
          </Fragment>
        );
      })}
    </div>
  );
};
