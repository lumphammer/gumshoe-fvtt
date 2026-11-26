import type { ComponentProps } from "react";

import { difficultyChoices } from "../../module/abilityTests/outcome";
import { Select } from "../inputs/Select";

type DifficultySelectProps = Omit<
  ComponentProps<typeof Select>,
  "value" | "onChange"
> & {
  value: number;
  onChange: (value: number) => void;
};

/** Pick a test's Difficulty */
export const DifficultySelect = ({
  value,
  onChange,
  ...props
}: DifficultySelectProps) => (
  <Select
    {...props}
    value={value}
    onChange={(e) => onChange(Number(e.currentTarget.value))}
  >
    {difficultyChoices(value).map((difficulty) => (
      <option key={difficulty} value={difficulty}>
        {difficulty}
      </option>
    ))}
  </Select>
);
