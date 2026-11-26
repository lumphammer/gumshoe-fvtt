import type { ComponentProps } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { difficultyChoices } from "../../module/abilityTests/outcome";
import { Select } from "../inputs/Select";

/** the choice to ask the GM for the Difficulty before rolling */
const askTheGM = "ask";

type DifficultySelectProps = Omit<
  ComponentProps<typeof Select>,
  "value" | "onChange"
> & {
  /** null to ask the GM */
  value: number | null;
  onChange: (value: number | null) => void;
  /** offer to ask the GM (not to the GM) */
  canAskTheGM?: boolean;
};

/** Pick a test's Difficulty, or ask the GM for it */
export const DifficultySelect = ({
  value,
  onChange,
  canAskTheGM = true,
  ...props
}: DifficultySelectProps) => (
  <Select
    {...props}
    value={value ?? askTheGM}
    onChange={(e) => {
      const picked = e.currentTarget.value;
      onChange(picked === askTheGM ? null : Number(picked));
    }}
  >
    {canAskTheGM && (
      <option value={askTheGM}>{getTranslated("Ask the GM")}</option>
    )}
    {difficultyChoices(value ?? undefined).map((difficulty) => (
      <option key={difficulty} value={difficulty}>
        {difficulty}
      </option>
    ))}
  </Select>
);
