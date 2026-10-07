import { useCallback, useContext } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { ThemeContext } from "../../themes/ThemeContext";

type PoolCheckboxProps = {
  value: number;
  selected: boolean;
  onClick: (value: number) => void;
};

export const PoolCheckbox = ({
  value,
  selected,
  onClick: onClickProp,
}: PoolCheckboxProps) => {
  const onClick = useCallback(() => {
    onClickProp(value);
  }, [onClickProp, value]);

  const theme = useContext(ThemeContext);
  const isEditable = useIsEditable();

  return (
    <a
      tabIndex={isEditable ? 0 : undefined}
      onClick={isEditable ? onClick : undefined}
      aria-disabled={!isEditable}
      css={{
        width: "auto",
        height: "1.2em",
        background: selected
          ? theme.colors.accent
          : theme.colors.backgroundPrimary,
        color: `${
          selected ? theme.colors.accentContrast : undefined
        } !important`,
        textAlign: "center",
        display: "inline-block",
        position: "relative",
      }}
    >
      {value}
    </a>
  );
};
