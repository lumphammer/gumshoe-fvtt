import { useContext } from "react";

import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const CombatOptionsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  let idx = 0;

  return (
    <InputGrid>
      <SettingsGridField label="Use NPC Combat bonuses?" index={idx++}>
        <Toggle
          checked={settings.useNpcCombatBonuses}
          onChange={setters.useNpcCombatBonuses}
        />
      </SettingsGridField>
      <SettingsGridField label="Use turn-passing initiative?" index={idx}>
        <Toggle
          checked={settings.useTurnPassingInitiative}
          onChange={setters.useTurnPassingInitiative}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

CombatOptionsSettings.displayName = "CombatOptionsSettings";
