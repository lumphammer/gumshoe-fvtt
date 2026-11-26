import type { ComponentProps } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { Select } from "../inputs/Select";

/** the choice to leave the Difficulty for the GM to set on the card */
const unset = "unset";

/**
 * The book's Difficulties run from 2 to 8, with some room above. 0 and 1
 * can't be failed, so they're not offered.
 */
const difficulties = Array.from({ length: 11 }, (_, i) => i + 2);

type DifficultySelectProps = Omit<
  ComponentProps<typeof Select>,
  "value" | "onChange"
> & {
  /** null to leave it for the GM to set on the card */
  value: number | null;
  onChange: (value: number | null) => void;
};

/** Pick a test's Difficulty, or leave it for the GM */
export const DifficultySelect = ({
  value,
  onChange,
  ...props
}: DifficultySelectProps) => {
  // a value from elsewhere (an imported setting) may be outside the range
  const options =
    value === null || difficulties.includes(value)
      ? difficulties
      : [...difficulties, value].sort((a, b) => a - b);
  return (
    <Select
      {...props}
      value={value ?? unset}
      onChange={(e) => {
        const picked = e.currentTarget.value;
        onChange(picked === unset ? null : Number(picked));
      }}
    >
      <option value={unset}>{getTranslated("Let the GM set it")}</option>
      {options.map((difficulty) => (
        <option key={difficulty} value={difficulty}>
          {difficulty}
        </option>
      ))}
    </Select>
  );
};
