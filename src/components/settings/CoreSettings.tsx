import React, { useCallback, useContext } from "react";

import * as constants from "../../constants";
import { assertGame } from "../../functions/isGame";
import { runtimeConfig } from "../../runtime";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { DispatchContext, StateContext } from "./contexts";
import { SettingsGridField } from "./SettingsGridField";
import { store } from "./store";
import type { Setters } from "./types";

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
  return (
    <InputGrid
      css={{
        flex: 1,
        overflow: "auto",
      }}
    >
      <SettingsGridField label="System Preset">
        <Select value={settings.systemPreset} onChange={onSelectPreset}>
          {Object.keys(presets).map((presetId: string) => (
            <option key={presetId} value={presetId}>
              {presets[presetId].displayName}
            </option>
          ))}
          {settings.systemPreset === constants.customSystem && (
            <option value={constants.customSystem}>Custom</option>
          )}
        </Select>
      </SettingsGridField>
      <SettingsGridField label="Visual Theme">
        <Select
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
        </Select>
      </SettingsGridField>
    </InputGrid>
  );
};

CoreSettings.displayName = "CoreSettings";
