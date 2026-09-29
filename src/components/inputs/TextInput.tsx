import { cx } from "@emotion/css";
import type { ChangeEvent } from "react";
import { useCallback, useContext } from "react";

import { ThemeContext } from "../../themes/ThemeContext";
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

  const onChangeCb = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.currentTarget.value);
    },
    [onChange],
  );

  const theme = useContext(ThemeContext);

  const errorColor = theme.colors.bgTransDangerPrimary;

  return (
    <input
      role="text-input"
      size={3}
      id={id}
      css={{
        flex: 1,
        width: "100%",
        "::placeholder": {
          opacity: 0.5,
          fontStyle: "italic",
        },
      }}
      style={{
        backgroundColor:
          validation?.state === "failed" ? errorColor : undefined,
      }}
      className={cx(className, validation?.state === "failed" && "error")}
      data-lpignore="true"
      value={value}
      defaultValue={defaultValue}
      onChange={onChangeCb}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
};
