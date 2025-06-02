import React, { useCallback, useContext } from "react";

import * as constants from "../../constants";
import { assertGame } from "../../functions/isGame";
import { runtimeConfig } from "../../runtime";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { InputGrid } from "../inputs/InputGrid";
import { ListEdit } from "../inputs/ListEdit";
import { PersonalDetailsListEdit } from "../inputs/PersonalDetailsListEdit";
import { Toggle } from "../inputs/Toggle";
import { DispatchContext, StateContext } from "./contexts";
import { SettingsGridField } from "./SettingsGridField";
import { store } from "./store";
import { Setters } from "./types";

interface CoreSettingsProps {
  setters: Setters;
}

export const CoreSettings = ({ setters }: CoreSettingsProps) => {
  const presets = runtimeConfig.presets;
  const { settings } = useContext(StateContext);
  const dispatch = useContext(DispatchContext);

  const onSelectPreset = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      assertGame(game);
      const presetId = e.currentTarget.value;
      if (presetId === constants.customSystem) {
        setters.systemPreset(presetId);
        return;
      }
      const preset = presets[presetId];
      if (!preset) {
        throw new Error(
          "Somehow ended up picking a preset which doesnae exist",
        );
      }
      dispatch(store.creators.applyPreset({ preset, presetId }));
    },
    [dispatch, presets, setters],
  );

  let idx = 0;

  return (
    <InputGrid
      css={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <SettingsGridField label="System Preset">
        <select value={settings.systemPreset} onChange={onSelectPreset}>
          {Object.keys(presets).map((presetId: string) => (
            <option key={presetId} value={presetId}>
              {presets[presetId].displayName}
            </option>
          ))}
          {settings.systemPreset === constants.customSystem && (
            <option value={constants.customSystem}>Custom</option>
          )}
        </select>
      </SettingsGridField>
      <SettingsGridField label="Visual Theme" index={idx++}>
        <select
          value={settings.defaultThemeName}
          onChange={(e) => {
            setters.defaultThemeName(e.currentTarget.value);
          }}
        >
          {Object.keys(runtimeConfig.themes).map((themeName: string) => (
            <option key={themeName} value={themeName}>
              {runtimeConfig.themes[themeName].displayName}
            </option>
          ))}
        </select>
      </SettingsGridField>
      <SettingsGridField label="Occupation Label" index={idx++}>
        <AsyncTextInput
          value={settings.occupationLabel}
          onChange={setters.occupationLabel}
        />
      </SettingsGridField>
      <SettingsGridField label="Personal details" index={idx++}>
        <PersonalDetailsListEdit
          personalDetails={settings.personalDetails}
          onChange={setters.personalDetails}
        />
      </SettingsGridField>
      <SettingsGridField label="Notes Fields" index={idx++}>
        <ListEdit value={settings.longNotes} onChange={setters.longNotes} />
      </SettingsGridField>

      <SettingsGridField label="Generic Occupation" index={idx++}>
        <AsyncTextInput
          onChange={setters.genericOccupation}
          value={settings.genericOccupation}
        />
      </SettingsGridField>

      <SettingsGridField label="ItemAddedNotifications" index={idx++}>
        <Toggle
          checked={settings.notifyItemAddedToActor}
          onChange={setters.notifyItemAddedToActor}
        />
      </SettingsGridField>
    </InputGrid>
  );
};

CoreSettings.displayName = "CoreSettings";
