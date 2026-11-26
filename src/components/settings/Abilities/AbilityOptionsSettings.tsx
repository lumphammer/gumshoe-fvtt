import { useContext } from "react";

import { DifficultySelect } from "../../abilities/DifficultySelect";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsNote } from "../SettingsNote";
import { Translate } from "../../Translate";
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
        <SettingsGridField label="Ask the GM for the Difficulty before rolling?">
          <Toggle
            checked={settings.askGMForTestDifficulty}
            onChange={setters.askGMForTestDifficulty}
          />
        </SettingsGridField>
        {settings.askGMForTestDifficulty && (
          <SettingsGridField label="Hide the Difficulty from players?">
            <Toggle
              checked={settings.hideTestDifficulty}
              onChange={setters.hideTestDifficulty}
            />
          </SettingsGridField>
        )}
        <SettingsGridField label="Show empty Investigative categories?">
          <Toggle
            checked={settings.showEmptyInvestigativeCategories}
            onChange={setters.showEmptyInvestigativeCategories}
          />
        </SettingsGridField>
      </InputGrid>
      {settings.askGMForTestDifficulty && (
        <SettingsNote mode="info">
          <Translate>AskTheGMForTheDifficultyNote</Translate>
        </SettingsNote>
      )}
    </>
  );
};

AbilityOptionsSettings.displayName = "AbilityOptionsSettings";
