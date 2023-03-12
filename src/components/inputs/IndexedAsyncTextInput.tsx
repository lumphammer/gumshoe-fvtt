import React, { useCallback } from "react";
import { AsyncTextInput, AsyncTextInputProps } from "./AsyncTextInput";

// basically the same as AsyncTextInputProps but with `index`, and onChnage
// also accepts an index.
type IndexedAsyncTextInputProps = Omit<AsyncTextInputProps, "onChange"> & {
  index: number;
  onChange: (newValue: string, index: number) => void;
};

/**
 * this is the same as AsyncTextInput, but with an index prop which will get
 * passed back to the onChange handler.
 */
export const IndexedAsyncTextInput: React.FC<IndexedAsyncTextInputProps> = ({
  index,
  onChange,
  ...props
}) => {
  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue, index);
    },
    [index, onChange],
  );

  return <AsyncTextInput {...props} onChange={handleChange} />;
};

IndexedAsyncTextInput.displayName = "IndexedAsyncTextInput";
