import { useContext } from "react";

import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const DeveloperSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <InputGrid>
      <SettingsGridField label="Debug translations?">
        <Toggle
          checked={settings.debugTranslations}
          onChange={setters.debugTranslations}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

DeveloperSettings.displayName = "DeveloperSettings";
