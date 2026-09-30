import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { Toggle } from "../inputs/Toggle";

type OptionalNumberInputProps = {
  value: number | undefined;
  onToggle: (enabled: boolean) => void;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

/**
 * A number which may be switched off entirely, e.g. an optional min or max.
 */
export const OptionalNumberInput = ({
  value,
  onToggle,
  onChange,
  min,
  max,
}: OptionalNumberInputProps) => {
  return (
    <div
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "0.5em",
      }}
    >
      <Toggle checked={value !== undefined} onChange={onToggle} />
      {value !== undefined && (
        <AsyncNumberInput
          css={{ flex: 1 }}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
        />
      )}
    </div>
  );
};

OptionalNumberInput.displayName = "OptionalNumberInput";
