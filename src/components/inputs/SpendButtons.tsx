import { CheckButtons } from "./CheckButtons";

const spendValues = Array.from({ length: 8 }, (_, i) => i);

type SpendButtonsProps = {
  value: number;
  onChange: (value: number) => void;
  /** the most that can be spent; higher buttons are disabled */
  max: number;
};

/**
 * A compact row of buttons for choosing how many points to spend, 0 to 7, as
 * on the weapon and ability sheets.
 */
export const SpendButtons = ({ value, onChange, max }: SpendButtonsProps) => (
  <CheckButtons
    size={1}
    onChange={onChange}
    selected={value}
    options={spendValues.map((spend) => ({
      label: spend.toString(),
      value: spend,
      enabled: spend === 0 || spend <= max,
    }))}
  />
);

SpendButtons.displayName = "SpendButtons";
