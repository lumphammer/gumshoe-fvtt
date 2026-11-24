import { memo, useCallback } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { button } from "../../styled-system/recipes";
import { isActivationKey, keyboardFocus } from "../clickable";

type PoolCheckboxProps = {
  value: number;
  selected: boolean;
  /** the one pip of its tracker in the Tab order (`PoolTracker`) */
  tabStop: boolean;
  onClick: (value: number) => void;
};

/**
 * One of a pool tracker's values, as a radio in its group: the arrow keys
 * move between them (`PoolTracker`)
 */
export const PoolCheckbox = memo(function PoolCheckbox({
  value,
  selected,
  tabStop,
  onClick: onClickProp,
}: PoolCheckboxProps) {
  const onClick = useCallback(() => {
    onClickProp(value);
  }, [onClickProp, value]);
  const isEditable = useIsEditable();

  return (
    <a
      role="radio"
      aria-checked={selected}
      aria-disabled={!isEditable}
      tabIndex={isEditable ? (tabStop ? 0 : -1) : undefined}
      {...(isEditable ? keyboardFocus : {})}
      onClick={isEditable ? onClick : undefined}
      onKeyDown={
        isEditable
          ? (event) => {
              if (isActivationKey(event) && !event.repeat) {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      data-value={value}
      // a pip, pressed when it's the pool's value
      data-interactive
      data-pressed={selected || undefined}
      className={button({ kind: "pip" })}
    >
      {value}
    </a>
  );
});
