import { useContext } from "react";

import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

/** Bonds are spent on the Stability ability, so that's set a page up */
export const BondsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <InputGrid>
      <SettingsGridField label="Use Bonds?">
        <Toggle checked={settings.useBonds} onChange={setters.useBonds} />
      </SettingsGridField>
      {settings.useBonds && (
        <SettingsGridField label="Category spent when rebuilding Bonds">
          <AsyncTextInput
            value={settings.bondRebuildSpendCategory}
            onChange={setters.bondRebuildSpendCategory}
          />
        </SettingsGridField>
      )}
    </InputGrid>
  );
};

BondsSettings.displayName = "BondsSettings";
