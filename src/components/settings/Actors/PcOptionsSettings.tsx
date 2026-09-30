import { useContext } from "react";

import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const PcOptionsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  let idx = 0;

  return (
    <InputGrid>
      <SettingsGridField label="Occupation Label" index={idx++}>
        <AsyncTextInput
          value={settings.occupationLabel}
          onChange={setters.occupationLabel}
        />
      </SettingsGridField>
      <SettingsGridField label="Generic Occupation" index={idx++}>
        <AsyncTextInput
          onChange={setters.genericOccupation}
          value={settings.genericOccupation}
        />
      </SettingsGridField>
      <SettingsGridField label="ItemAddedNotifications" index={idx}>
        <Toggle
          checked={settings.notifyItemAddedToActor}
          onChange={setters.notifyItemAddedToActor}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

PcOptionsSettings.displayName = "PcOptionsSettings";
