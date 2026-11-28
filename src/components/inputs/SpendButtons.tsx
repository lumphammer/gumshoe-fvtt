import type { ChangeEvent } from "react";

import { CheckButtons } from "./CheckButtons";
import { useIsEditable } from "../../hooks/useIsEditable";
import { css, cx } from "../../styled-system/css";
import { button } from "../../styled-system/recipes";

/** spends above this are rare: they share the last slot, as a dropdown */
const top = 7;

const buttonValues = Array.from({ length: top + 1 }, (_, i) => i);

type SpendOverflowProps = {
  value: number;
  onChange: (value: number) => void;
  max: number;
  disabled: boolean;
};

/**
 * The last slot, for 7 up to `max`: a dropdown that looks like the buttons
 * beside it, and pressed like them when it holds the spend. Until then it
 * reads "7+".
 */
const SpendOverflow = ({
  value,
  onChange,
  max,
  disabled,
}: SpendOverflowProps) => {
  const chosen = value >= top;
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(Number(e.currentTarget.value));
  };

  return (
    <select
      value={chosen ? value : ""}
      onChange={handleChange}
      disabled={disabled}
      data-pressed={chosen || undefined}
      data-disabled={disabled || undefined}
      className={cx(
        button({ kind: "toolbar" }),
        css({
          flex: "1",
          // a little wider than a button: it holds "7+", or two digits
          minWidth: "2.5em",
          height: "auto",
          margin: "0",
          appearance: "none",
          textAlign: "center",
          textAlignLast: "center",
          fontWeight: "bold",
          fontSize: "1em",
        }),
      )}
    >
      <option value="" disabled hidden>
        {top}+
      </option>
      {Array.from({ length: max - top + 1 }, (_, i) => top + i).map((spend) => (
        <option key={spend} value={spend}>
          {spend}
        </option>
      ))}
    </select>
  );
};

type SpendButtonsProps = {
  value: number;
  onChange: (value: number) => void;
  /** the most that can be spent; higher buttons are disabled */
  max: number;
  /** disable every button, 0 included */
  disabled?: boolean;
  /**
   * when `max` is above 7, make the last slot a dropdown from 7 up to `max`,
   * so the rare big spend is possible without a row of buttons for it
   */
  overflowToMax?: boolean;
};

/**
 * A compact row of buttons for choosing how many points to spend, 0 to 7, as
 * on the weapon and ability sheets.
 */
export const SpendButtons = ({
  value,
  onChange,
  max,
  disabled = false,
  overflowToMax = false,
}: SpendButtonsProps) => {
  const isEditable = useIsEditable();
  const overflow = overflowToMax && max > top;
  const values = overflow ? buttonValues.slice(0, top) : buttonValues;

  return (
    <CheckButtons
      size={1}
      onChange={onChange}
      selected={value}
      options={values.map((spend) => ({
        label: spend.toString(),
        value: spend,
        enabled: !disabled && (spend === 0 || spend <= max),
      }))}
    >
      {overflow && (
        <SpendOverflow
          value={value}
          onChange={onChange}
          max={max}
          disabled={disabled || !isEditable}
        />
      )}
    </CheckButtons>
  );
};

SpendButtons.displayName = "SpendButtons";
