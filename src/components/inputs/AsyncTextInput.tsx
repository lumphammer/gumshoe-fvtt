import type { CSSProperties } from "react";

import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { TextInput } from "./TextInput";

export type AsyncTextInputProps = {
  value: undefined | string;
  onChange: (newValue: string) => void | PromiseLike<unknown>;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  placeholder?: string;
  /** its name, when no label names it */
  ariaLabel?: string;
};

export const AsyncTextInput = ({
  value = "",
  onChange: onChangeOrig,
  className,
  style,
  disabled,
  placeholder,
  ariaLabel,
}: AsyncTextInputProps) => {
  const { onChange, onFocus, onBlur, display } = useAsyncUpdate(
    value,
    onChangeOrig,
  );

  return (
    <TextInput
      className={className}
      style={style}
      value={display}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
    />
  );
};
