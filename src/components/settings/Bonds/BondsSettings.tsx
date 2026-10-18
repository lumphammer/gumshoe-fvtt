import { useContext } from "react";

import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsNote } from "../SettingsNote";
import { SettingsStringList } from "../SettingsStringList";
import type { Setters } from "../types";

export const BondsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <>
      <InputGrid>
        <SettingsGridField label="Use Bonds?">
          <Toggle checked={settings.useBonds} onChange={setters.useBonds} />
        </SettingsGridField>
        {settings.useBonds && (
          <>
            <SettingsGridField label="Ability Bonds can be spent on">
              <AsyncTextInput
                value={settings.bondStabilityAbility}
                onChange={setters.bondStabilityAbility}
              />
            </SettingsGridField>
            <SettingsGridField label="Category spent when rebuilding Bonds">
              <AsyncTextInput
                value={settings.bondRebuildSpendCategory}
                onChange={setters.bondRebuildSpendCategory}
              />
            </SettingsGridField>
            <SettingsGridField label="Use Stability states?">
              <Toggle
                checked={settings.useStabilityStates}
                onChange={setters.useStabilityStates}
              />
            </SettingsGridField>
            {settings.useStabilityStates && (
              <SettingsGridField label="Ability Unnatural shocks reduce">
                <AsyncTextInput
                  value={settings.sanityAbility}
                  onChange={setters.sanityAbility}
                />
              </SettingsGridField>
            )}
          </>
        )}
      </InputGrid>
      {settings.useBonds && (
        <>
          <h3>
            <Translate>Abilities capped by Adapted to Violence</Translate>
          </h3>
          <SettingsNote>
            <Translate>ViolenceCappedAbilitiesNote</Translate>
          </SettingsNote>
          <SettingsStringList
            value={settings.violenceCappedAbilities}
            onChange={setters.violenceCappedAbilities}
            sortable={false}
            addLabel="Add ability"
            emptyMessage="No abilities yet."
          />
        </>
      )}
    </>
  );
};

BondsSettings.displayName = "BondsSettings";
