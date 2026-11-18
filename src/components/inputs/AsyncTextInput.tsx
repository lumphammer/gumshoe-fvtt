import type { CSSProperties } from "react";

import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { TextInput } from "./TextInput";

export type AsyncTextInputProps = {
  value: undefined | string;
  onChange: (newValue: string) => void;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  placeholder?: string;
};

export const AsyncTextInput = ({
  value = "",
  onChange: onChangeOrig,
  className,
  style,
  disabled,
  placeholder,
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
    />
  );
};
