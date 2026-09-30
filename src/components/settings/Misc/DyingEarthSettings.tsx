import { useContext } from "react";

import { InputGrid } from "../../inputs/InputGrid";

import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsStringList } from "../SettingsStringList";
import type { Setters } from "../types";

export const DyingEarthSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);
  return (
    <InputGrid>
      <SettingsGridField label="Use Moribund World-style abilities">
        <Toggle
          checked={settings.useMwStyleAbilities}
          onChange={setters.useMwStyleAbilities}
        />
      </SettingsGridField>
      <SettingsGridField label="Use alternative item types">
        <Toggle
          checked={settings.mwUseAlternativeItemTypes}
          onChange={setters.mwUseAlternativeItemTypes}
        />
      </SettingsGridField>
      <SettingsGridField label="Hidden Short Notes Fields">
        <SettingsStringList
          value={settings.mwHiddenShortNotes}
          onChange={setters.mwHiddenShortNotes}
          sortable={false}
        />
      </SettingsGridField>
      <SettingsGridField label="Use injury status">
        <Toggle
          checked={settings.useMwInjuryStatus}
          onChange={setters.useMwInjuryStatus}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

DyingEarthSettings.displayName = "DyingEarthSettings";
