import React, { useCallback } from "react";

import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { Button } from "./Button";
import { TextInput } from "./TextInput";
import type { ValidationResult } from "./types";
import { css, cx } from "../../styled-system/css";

type AsyncNumberInputProps = {
  value: undefined | number;
  /** return the save's promise, so what's shown waits for it (see `useAsyncUpdate`) */
  onChange: (newValue: number) => void | PromiseLike<unknown>;
  className?: string;
  style?: React.CSSProperties;
  min?: number;
  max?: number;
  /** only accept whole numbers */
  integer?: boolean;
  disabled?: boolean;
  noPlusMinus?: boolean;
  smallButtons?: boolean;
  /** its name, for one with no label (in a `GridField`, say) to name it */
  label?: string;
};

const adjust = (display: string, by: number, min?: number, max?: number) => {
  let result = Number(display) + by;
  if (Number.isNaN(result)) {
    result = 0;
  }
  if (max !== undefined) {
    result = Math.min(max, result);
  }
  if (min !== undefined) {
    result = Math.max(min, result);
  }
  return result.toString();
};

export const AsyncNumberInput = React.memo<AsyncNumberInputProps>(
  ({
    value,
    onChange: onChangeOrig,
    className,
    style,
    min,
    max,
    integer = false,
    disabled,
    noPlusMinus = false,
    smallButtons = false,
    label,
  }) => {
    const validate = useCallback(
      (text: string): ValidationResult => {
        const num = Number(text);
        if (Number.isNaN(num)) {
          return {
            state: "failed",
            reasons: ["Not a number"],
          };
        } else if (integer && !Number.isInteger(num)) {
          return {
            state: "failed",
            reasons: ["Not a whole number"],
          };
        } else if (min !== undefined && num < min) {
          return {
            state: "failed",
            reasons: ["Too low"],
          };
        } else if (max !== undefined && num > max) {
          return {
            state: "failed",
            reasons: ["Too high"],
          };
        } else {
          return {
            state: "succeeded",
            value: num,
          };
        }
      },
      [integer, max, min],
    );

    const onChangeString = useCallback(
      (text: string) => {
        const result = validate(text);
        if (result.state === "succeeded") {
          return onChangeOrig(result.value);
        }
      },
      [onChangeOrig, validate],
    );

    const { display, onBlur, onChange, onFocus } = useAsyncUpdate(
      (value || 0).toString(),
      onChangeString,
    );

    const onClickInc = useCallback(() => {
      onChange(adjust(display, +1, min, max));
    }, [display, max, min, onChange]);

    const onClickDec = useCallback(() => {
      onChange(adjust(display, -1, min, max));
    }, [display, max, min, onChange]);

    const validationResult = validate(display);

    /**
     * The WAI-ARIA spin button pattern: the input is the one control, and Up
     * and Down change it (Shift, or Page Up and Page Down, by ten). The
     * buttons are for the mouse, out of the Tab order and hidden from
     * screen readers, which hear the value change instead.
     */
    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      const step = event.shiftKey ? 10 : 1;
      const by = {
        ArrowUp: step,
        ArrowDown: -step,
        PageUp: 10,
        PageDown: -10,
      }[event.key];
      if (by === undefined) {
        return;
      }
      event.preventDefault();
      onChange(adjust(display, by, min, max));
    };

    const showButtons = noPlusMinus === undefined || !noPlusMinus;
    // clicking a button leaves focus where it was (in the input, say)
    const keepFocus = (event: React.MouseEvent) => event.preventDefault();

    return (
      <div
        className={cx(
          className,
          css({
            display: "flex",
            flexDirection: "row",
            "& button": {
              lineHeight: "inherit",
              flexBasis: "min-content",
              flex: "[0]",
              padding: "0 0.25em",
              fontSize: smallButtons ? "0.6em" : undefined,
            },
          }),
        )}
        style={style}
      >
        {showButtons && (
          <Button
            onClick={onClickDec}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
            onMouseDown={keepFocus}
          >
            <i className="fa fa-minus" />
          </Button>
        )}
        {showButtons && (
          <Button
            onClick={onClickInc}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
            onMouseDown={keepFocus}
          >
            <i className="fa fa-plus" />
          </Button>
        )}
        <TextInput
          validation={validationResult}
          className={css({
            flex: "[1]",
            flexBasis: "min-content",
            userSelect: "text",
          })}
          value={display}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          disabled={disabled}
          ariaLabel={label}
          role="spinbutton"
          aria={{
            "aria-valuenow":
              validationResult.state === "succeeded"
                ? validationResult.value
                : undefined,
            "aria-valuemin": min,
            "aria-valuemax": max,
          }}
        />
      </div>
    );
  },
);

AsyncNumberInput.displayName = "AsyncNumberInput";
