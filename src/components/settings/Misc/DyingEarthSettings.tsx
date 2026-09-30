import { useContext } from "react";

import { InputGrid } from "../../inputs/InputGrid";
import { ListEdit } from "../../inputs/ListEdit";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const DyingEarthSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  let idx = 0;

  return (
    <InputGrid>
      <SettingsGridField
        label="Use Moribund World-style abilities"
        index={idx++}
      >
        <Toggle
          checked={settings.useMwStyleAbilities}
          onChange={setters.useMwStyleAbilities}
        />
      </SettingsGridField>
      <SettingsGridField label="Use alternative item types" index={idx++}>
        <Toggle
          checked={settings.mwUseAlternativeItemTypes}
          onChange={setters.mwUseAlternativeItemTypes}
        />
      </SettingsGridField>
      <SettingsGridField label="Hidden Short Notes Fields" index={idx++}>
        <ListEdit
          value={settings.mwHiddenShortNotes}
          onChange={setters.mwHiddenShortNotes}
        />
      </SettingsGridField>
      <SettingsGridField label="Use injury status" index={idx}>
        <Toggle
          checked={settings.useMwInjuryStatus}
          onChange={setters.useMwInjuryStatus}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

DyingEarthSettings.displayName = "DyingEarthSettings";
