import { useContext } from "react";

import { getDevMode } from "../../functions/utilities";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { InputGrid } from "../inputs/InputGrid";
import { ListEdit } from "../inputs/ListEdit";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { StateContext } from "./contexts";
import { ImportExport } from "./ImportExport";
import { SettingsGridField } from "./SettingsGridField";
import { Setters } from "./types";

export const MiscSettings = ({ setters }: { setters: Setters }) => {
  const isDevMode = getDevMode();

  let idx = 0;

  const { settings } = useContext(StateContext);

  return (
    <InputGrid
      css={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <SettingsGridField label="Custom themes path" index={idx++}>
        <AsyncTextInput
          onChange={setters.customThemePath}
          value={settings.customThemePath}
        />
      </SettingsGridField>
      <SettingsGridField label="Use turn-passing initiative?" index={idx++}>
        <Toggle
          checked={settings.useTurnPassingInitiative}
          onChange={setters.useTurnPassingInitiative}
        />
      </SettingsGridField>

      {isDevMode && (
        <SettingsGridField label="Debug translations?" index={idx++}>
          <Toggle
            checked={settings.debugTranslations}
            onChange={setters.debugTranslations}
          />
        </SettingsGridField>
      )}

      {/* ####################################################################
          MORIBUND WORLD STUFF BELOW HERE
        #################################################################### */}

      <hr css={{ gridColumn: "label / end" }} />
      <h2 css={{ gridColumn: "label / end" }}>
        <Translate>Settings for Moribund World users</Translate>
      </h2>
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
      {/* eslint-disable-next-line no-useless-assignment */}
      <SettingsGridField label="Use injury status" index={idx++}>
        <Toggle
          checked={settings.useMwInjuryStatus}
          onChange={setters.useMwInjuryStatus}
        />
      </SettingsGridField>

      {/* ####################################################################
          IMPORT / EXPORT
        #################################################################### */}

      <ImportExport />
    </InputGrid>
  );
};

MiscSettings.displayName = "MiscSettings";
