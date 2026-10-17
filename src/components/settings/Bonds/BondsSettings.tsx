import { useContext } from "react";

import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

export const BondsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <InputGrid>
      <SettingsGridField label="Use Bonds?">
        <Toggle checked={settings.useBonds} onChange={setters.useBonds} />
      </SettingsGridField>
    </InputGrid>
  );
};

BondsSettings.displayName = "BondsSettings";
