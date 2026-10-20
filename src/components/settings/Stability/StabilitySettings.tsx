import { useContext } from "react";

import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsMenu } from "../SettingsMenu";
import { SettingsNote } from "../SettingsNote";
import type { Setters } from "../types";
import { NamedTranslate } from "./NamedTranslate";
import { stabilityPages } from "./stabilityPages";

/**
 * Sanity & Stability: the abilities, and a menu of the subsystems which use
 * them (see docs/stability-settings-plan.md)
 */
export const StabilitySettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <>
      <InputGrid>
        <SettingsGridField
          label={<NamedTranslate>UseStabilityRules</NamedTranslate>}
        >
          <Toggle
            checked={settings.useStabilityRules}
            onChange={setters.useStabilityRules}
          />
        </SettingsGridField>
        {settings.useStabilityRules && (
          <>
            <SettingsGridField
              label={<NamedTranslate>NameOfStabilityAbility</NamedTranslate>}
            >
              <AsyncTextInput
                value={settings.stabilityAbility}
                onChange={setters.stabilityAbility}
              />
            </SettingsGridField>
            <SettingsGridField
              label={<NamedTranslate>UseSanityRules</NamedTranslate>}
            >
              <Toggle
                checked={settings.useSanityRules}
                onChange={setters.useSanityRules}
              />
            </SettingsGridField>
            {settings.useSanityRules && (
              <>
                <SettingsGridField
                  label={<NamedTranslate>NameOfSanityAbility</NamedTranslate>}
                >
                  <AsyncTextInput
                    value={settings.sanityAbility}
                    onChange={setters.sanityAbility}
                  />
                </SettingsGridField>
                <SettingsGridField
                  label={<NamedTranslate>SanityRatingCappedBy</NamedTranslate>}
                >
                  <AsyncTextInput
                    value={settings.sanityCapAbility}
                    onChange={setters.sanityCapAbility}
                  />
                </SettingsGridField>
                <SettingsGridField
                  label={<NamedTranslate>BaseSanityCap</NamedTranslate>}
                >
                  <AsyncNumberInput
                    min={0}
                    value={settings.sanityCapBase}
                    onChange={setters.sanityCapBase}
                  />
                </SettingsGridField>
              </>
            )}
          </>
        )}
      </InputGrid>
      {settings.useStabilityRules && (
        <>
          {settings.useSanityRules && (
            <SettingsNote>
              <NamedTranslate>SanityCapNote</NamedTranslate>
            </SettingsNote>
          )}
          <SettingsMenu pages={stabilityPages} />
        </>
      )}
    </>
  );
};

StabilitySettings.displayName = "StabilitySettings";
