import { useContext } from "react";

import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import type { Setters } from "../types";

/** Contacts, each with a pool taken from the Network ability */
export const NetworkContactsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <InputGrid>
      <SettingsGridField label="Use Network contacts?">
        <Toggle
          checked={settings.useNetworkContacts}
          onChange={setters.useNetworkContacts}
        />
      </SettingsGridField>
      {settings.useNetworkContacts && (
        <SettingsGridField label="Name of Network ability">
          <AsyncTextInput
            value={settings.networkAbility}
            onChange={setters.networkAbility}
          />
        </SettingsGridField>
      )}
    </InputGrid>
  );
};

NetworkContactsSettings.displayName = "NetworkContactsSettings";
