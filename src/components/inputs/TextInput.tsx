import type {
  AriaAttributes,
  AriaRole,
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
} from "react";
import { useCallback, useContext } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { cx } from "../../styled-system/css";
import { input } from "../../styled-system/recipes";
import { IdContext } from "../IdContext";
import type { ValidationResult } from "./types";

type TextInputProps = {
  className?: string;
  style?: CSSProperties;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  validation?: ValidationResult;
  /** its name, when no label names it */
  ariaLabel?: string;
  /** for an input which is more than text (a number's spin button) */
  role?: AriaRole;
  aria?: AriaAttributes;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export const TextInput = ({
  className,
  style,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  disabled,
  placeholder,
  validation,
  ariaLabel,
  role,
  aria,
  onKeyDown,
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
      size={3}
      id={id}
      role={role}
      {...aria}
      aria-invalid={invalid || undefined}
      aria-label={ariaLabel}
      className={cx(input(), "inv-default-text-input", className)}
      style={style}
      data-lpignore="true"
      value={value}
      defaultValue={defaultValue}
      onChange={onChangeCb}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      disabled={disabled || !isEditable}
      placeholder={placeholder}
    />
  );
};
