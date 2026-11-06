import type { ChangeEvent } from "react";
import { useCallback, useContext } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { css, cx } from "../../styled-system/css";
import { input } from "../../styled-system/recipes";
import { IdContext } from "../IdContext";
import type { ValidationResult } from "./types";

type TextInputProps = {
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  validation?: ValidationResult;
};

export const TextInput = ({
  className,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  disabled,
  placeholder,
  validation,
}: TextInputProps) => {
  const id = useContext(IdContext);
  const isEditable = useIsEditable();

  const onChangeCb = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.currentTarget.value);
    },
    [onChange],
  );

  const invalid = validation?.state === "failed";

  return (
    <input
      role="text-input"
      size={3}
      id={id}
      aria-invalid={invalid || undefined}
      className={cx(input(), css({ flex: "1", width: "100%" }), className)}
      data-lpignore="true"
      value={value}
      defaultValue={defaultValue}
      onChange={onChangeCb}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled || !isEditable}
      placeholder={placeholder}
    />
  );
};
