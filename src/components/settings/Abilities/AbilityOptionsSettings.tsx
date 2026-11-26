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
    <>
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
        <SettingsGridField label="Hide the Difficulty from players when the GM sets it?">
          <Toggle
            checked={settings.hideTestDifficulty}
            onChange={setters.hideTestDifficulty}
          />
        </SettingsGridField>
        <SettingsGridField label="Show empty Investigative categories?">
          <Toggle
            checked={settings.showEmptyInvestigativeCategories}
            onChange={setters.showEmptyInvestigativeCategories}
          />
        </SettingsGridField>
      </InputGrid>
    </>
  );
};

AbilityOptionsSettings.displayName = "AbilityOptionsSettings";
