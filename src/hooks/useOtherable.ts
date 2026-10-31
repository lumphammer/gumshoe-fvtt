import { useCallback, useState } from "react";

const customValueToken = "CUSTOM_VALUE_TOKEN_DwSXJ76sDgTvXQwVCp8He";

type UseOtherableArgs = {
  value: string;
  onChange: (value: string) => void;
  pickerValues: readonly string[];
  validValues?: readonly string[];
};

export const useOtherable = ({
  value,
  onChange,
  pickerValues,
  validValues,
}: UseOtherableArgs) => {
  const [showCustomValue, setShowCustomValue] = useState(
    !pickerValues.includes(value),
  );

  const effectiveValue = showCustomValue ? customValueToken : value;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.currentTarget.value === customValueToken) {
        setShowCustomValue(true);
      } else {
        setShowCustomValue(false);
        onChange(e.currentTarget.value);
      }
    },
    [onChange],
  );

  const notFound = validValues?.includes(value) === false;

  return {
    effectiveValue,
    handleChange,
    showCustomValue,
    customValueToken,
    notFound,
  };
};
