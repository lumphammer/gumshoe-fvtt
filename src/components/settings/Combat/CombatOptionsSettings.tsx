import { useContext } from "react";

import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const CombatOptionsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);
  return (
    <InputGrid>
      <SettingsGridField label="Use NPC Combat bonuses?">
        <Toggle
          checked={settings.useNpcCombatBonuses}
          onChange={setters.useNpcCombatBonuses}
        />
      </SettingsGridField>
      <SettingsGridField label="Use turn-passing initiative?">
        <Toggle
          checked={settings.useTurnPassingInitiative}
          onChange={setters.useTurnPassingInitiative}
        />
      </SettingsGridField>
      <SettingsGridField label="Use damage application?">
        <Toggle
          checked={settings.useDamageApplication}
          onChange={setters.useDamageApplication}
        />
      </SettingsGridField>
      {settings.useDamageApplication && (
        <>
          <SettingsGridField label="Use gunfire on humans?">
            <Toggle
              checked={settings.useGunfireOnHumans}
              onChange={setters.useGunfireOnHumans}
            />
          </SettingsGridField>
          <SettingsGridField label="Use critical hits?">
            <Toggle
              checked={settings.useCriticalHits}
              onChange={setters.useCriticalHits}
            />
          </SettingsGridField>
          <SettingsGridField label="Use Lethality and autofire?">
            <Toggle
              checked={settings.useLethalityAndAutofire}
              onChange={setters.useLethalityAndAutofire}
            />
          </SettingsGridField>
          {settings.useLethalityAndAutofire && (
            <>
              <SettingsGridField label="Use Shot Dry and jams?">
                <Toggle
                  checked={settings.useShotDryAndJams}
                  onChange={setters.useShotDryAndJams}
                />
              </SettingsGridField>
              <SettingsGridField label="Use walking fire?">
                <Toggle
                  checked={settings.useWalkingFire}
                  onChange={setters.useWalkingFire}
                />
              </SettingsGridField>
            </>
          )}
        </>
      )}
    </InputGrid>
  );
};

CombatOptionsSettings.displayName = "CombatOptionsSettings";
