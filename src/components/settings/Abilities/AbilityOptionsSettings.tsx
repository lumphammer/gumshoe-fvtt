import { useContext } from "react";

import { DifficultySelect } from "../../abilities/DifficultySelect";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const AbilityOptionsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);
  return (
    <InputGrid>
      <SettingsGridField label="Can Abilities be Boosted?">
        <Toggle checked={settings.useBoost} onChange={setters.useBoost} />
      </SettingsGridField>
      <SettingsGridField label="Default Difficulty">
        <DifficultySelect
          value={settings.defaultTestDifficulty}
          onChange={setters.defaultTestDifficulty}
        />
      </SettingsGridField>
      <SettingsGridField label="Keep Difficulties secret from players?">
        <Toggle
          checked={settings.secretTestDifficulty}
          onChange={setters.secretTestDifficulty}
        />
      </SettingsGridField>
      <SettingsGridField label="Show empty Investigative categories?">
        <Toggle
          checked={settings.showEmptyInvestigativeCategories}
          onChange={setters.showEmptyInvestigativeCategories}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

AbilityOptionsSettings.displayName = "AbilityOptionsSettings";
