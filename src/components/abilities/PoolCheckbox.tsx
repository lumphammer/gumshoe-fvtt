import { memo, useCallback } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { button } from "../../styled-system/recipes";
import { css, cx } from "../../styled-system/css";

type PoolCheckboxProps = {
  value: number;
  selected: boolean;
  onClick: (value: number) => void;
};

export const PoolCheckbox = memo(function PoolCheckbox({
  value,
  selected,
  onClick: onClickProp,
}: PoolCheckboxProps) {
  const onClick = useCallback(() => {
    onClickProp(value);
  }, [onClickProp, value]);
  const isEditable = useIsEditable();

  return (
    <a
      tabIndex={isEditable ? 0 : undefined}
      onClick={isEditable ? onClick : undefined}
      aria-disabled={!isEditable}
      // a pip, pressed when it's the pool's value
      data-interactive
      data-pressed={selected || undefined}
      className={cx(
        button({ kind: "pip" }),
        css({
          width: "auto",
          height: "1.2em",
          textAlign: "center",
          display: "inline-block",
          position: "relative",
        }),
      )}
    >
      {value}
    </a>
  );
});
