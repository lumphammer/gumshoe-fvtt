import React, { useCallback } from "react";

import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { Button } from "./Button";
import { TextInput } from "./TextInput";
import type { ValidationResult } from "./types";

type AsyncNumberInputProps = {
  value: undefined | number;
  onChange: (newValue: number) => void;
  className?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  noPlusMinus?: boolean;
  smallButtons?: boolean;
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
    min,
    max,
    disabled,
    noPlusMinus = false,
    smallButtons = false,
  }) => {
    const validate = useCallback(
      (text: string): ValidationResult => {
        const num = Number(text);
        if (Number.isNaN(num)) {
          return {
            state: "failed",
            reasons: ["Not a number"],
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
      [max, min],
    );

    const onChangeString = useCallback(
      (text: string) => {
        const result = validate(text);
        if (result.state === "succeeded") {
          onChangeOrig(result.value);
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

    return (
      <div
        css={{
          display: "flex",
          flexDirection: "row",
          button: {
            lineHeight: "inherit",
            flexBasis: "min-content",
            flex: 0,
            padding: "0 0.25em",
            fontSize: smallButtons ? "0.6em" : undefined,
          },
        }}
        className={className}
      >
        {(noPlusMinus === undefined || !noPlusMinus) && (
          <Button onClick={onClickDec} disabled={disabled}>
            <i className="fa fa-minus" />
          </Button>
        )}
        {(noPlusMinus === undefined || !noPlusMinus) && (
          <Button onClick={onClickInc} disabled={disabled}>
            <i className="fa fa-plus" />
          </Button>
        )}
        <TextInput
          validation={validationResult}
          css={{
            flex: 1,
            flexBasis: "min-content",
            userSelect: "text",
          }}
          value={display}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
        />
      </div>
    );
  },
);

AsyncNumberInput.displayName = "AsyncNumberInput";
