import { useAsyncUpdate } from "../../hooks/useAsyncUpdate";
import { TextArea } from "./TextArea";

type AsyncTextAreaProps = {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const AsyncTextArea = ({
  className,
  value,
  onChange: onChangeOrig,
  disabled,
}: AsyncTextAreaProps) => {
  const { onChange, onFocus, onBlur, display } = useAsyncUpdate(
    value,
    onChangeOrig,
  );

  return (
    <TextArea
      className={className}
      value={display || ""}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
    />
  );
};
