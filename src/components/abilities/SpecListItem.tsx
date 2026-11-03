import { useCallback } from "react";

import { AsyncTextInput } from "../inputs/AsyncTextInput";

type SpecListItemProps = {
  onChange: (value: string, index: number) => void;
  index: number;
  value: string;
  disabled?: boolean;
};

export const SpecListItem = ({
  onChange: onChangeProp,
  index,
  value,
  disabled = false,
}: SpecListItemProps) => {
  const onChange = useCallback(
    (newVal: string) => {
      onChangeProp(newVal, index);
    },
    [index, onChangeProp],
  );

  return (
    <AsyncTextInput
      value={value}
      onChange={onChange}
      disabled={disabled}
      // css={{

      // }}
    />
  );
};
