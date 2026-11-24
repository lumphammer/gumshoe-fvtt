import React, { useCallback, useContext, useId } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { IdContext, labelIdFor } from "../IdContext";
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
  /**
   * Its name, for one with no label (in a `GridField`, say) to name it
   * already
   */
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
    // the buttons are "Decrease" and "Increase", described by what they
    // change: the label, or else the field's (a `GridField`'s). Described
    // rather than named, so the field's label names only the input
    const id = useContext(IdContext);
    const ownLabelId = useId();
    const describedBy =
      label !== undefined ? ownLabelId : id ? labelIdFor(id) : undefined;

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
        {label !== undefined && (
          <span id={ownLabelId} hidden>
            {label}
          </span>
        )}
        {(noPlusMinus === undefined || !noPlusMinus) && (
          <Button
            onClick={onClickDec}
            disabled={disabled}
            aria-label={getTranslated("Decrease")}
            aria-describedby={describedBy}
          >
            <i className="fa fa-minus" aria-hidden="true" />
          </Button>
        )}
        {(noPlusMinus === undefined || !noPlusMinus) && (
          <Button
            onClick={onClickInc}
            disabled={disabled}
            aria-label={getTranslated("Increase")}
            aria-describedby={describedBy}
          >
            <i className="fa fa-plus" aria-hidden="true" />
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
          disabled={disabled}
          ariaLabel={label}
        />
      </div>
    );
  },
);

AsyncNumberInput.displayName = "AsyncNumberInput";
