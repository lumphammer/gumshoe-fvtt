import { useContext } from "react";

import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const OtherAbilityOptionsSettings = ({
  setters,
}: {
  setters: Setters;
}) => {
  const { settings } = useContext(StateContext);

  let idx = 0;

  return (
    <InputGrid>
      <SettingsGridField label="Can Abilities be Boosted?" index={idx++}>
        <Toggle checked={settings.useBoost} onChange={setters.useBoost} />
      </SettingsGridField>
      <SettingsGridField
        label="Show empty Investigative categories?"
        index={idx++}
      >
        <Toggle
          checked={settings.showEmptyInvestigativeCategories}
          onChange={setters.showEmptyInvestigativeCategories}
        />
      </SettingsGridField>
      {/* eslint-disable-next-line no-useless-assignment */}
      <SettingsGridField label="Use NPC Combat bonuses?" index={idx++}>
        <Toggle
          checked={settings.useNpcCombatBonuses}
          onChange={setters.useNpcCombatBonuses}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

OtherAbilityOptionsSettings.displayName = "OtherAbilityOptionsSettings";
