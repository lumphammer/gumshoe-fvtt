import { useContext } from "react";

import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { InputGrid } from "../../inputs/InputGrid";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const CustomThemesSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <InputGrid>
      <SettingsGridField label="Custom themes path">
        <AsyncTextInput
          onChange={setters.customThemePath}
          value={settings.customThemePath}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

CustomThemesSettings.displayName = "CustomThemesSettings";
