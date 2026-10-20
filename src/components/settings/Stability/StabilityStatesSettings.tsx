import type { StabilityStatesSettings as States } from "@lumphammer/investigator-fvtt-types";
import { useContext } from "react";

import {
  type StabilityStatusState,
  stabilityStateLabels,
  stabilityStatusStates,
} from "../../../module/stability/states";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { InputGrid } from "../../inputs/InputGrid";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { ModifyContext, StateContext } from "../contexts";
import { SettingsGridField } from "../SettingsGridField";
import { SettingsNote } from "../SettingsNote";
import type { Setters } from "../types";
import { NamedTranslate } from "./NamedTranslate";

/**
 * Stability states: their names, and the highest pool in each. What they do
 * stays the same.
 */
export const StabilityStatesSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);
  const modify = useContext(ModifyContext);

  const set =
    <K extends keyof States[StabilityStatusState]>(
      state: StabilityStatusState,
      key: K,
    ) =>
    (value: States[StabilityStatusState][K]) => {
      modify((s) => {
        s.stabilityStates[state][key] = value;
      });
    };

  return (
    <>
      <InputGrid>
        <SettingsGridField
          label={<NamedTranslate>UseStabilityStates</NamedTranslate>}
        >
          <Toggle
            checked={settings.useStabilityStates}
            onChange={setters.useStabilityStates}
          />
        </SettingsGridField>
      </InputGrid>
      {settings.useStabilityStates && (
        <>
          <SettingsNote>
            <NamedTranslate>StabilityStatesNote</NamedTranslate>
          </SettingsNote>
          <InputGrid>
            {stabilityStatusStates.map((state) => (
              <SettingsGridField
                key={state}
                label={stabilityStateLabels[state]}
              >
                <div
                  data-testid={`stability-state-${state}`}
                  css={{
                    display: "flex",
                    gap: "0.5em",
                    alignItems: "center",
                  }}
                >
                  <AsyncTextInput
                    css={{ flex: 2 }}
                    value={settings.stabilityStates[state].name}
                    onChange={set(state, "name")}
                  />
                  <span css={{ whiteSpace: "nowrap" }}>
                    <Translate>Pool at most</Translate>
                  </span>
                  <AsyncNumberInput
                    css={{ flex: 1 }}
                    value={settings.stabilityStates[state].upTo}
                    onChange={set(state, "upTo")}
                  />
                </div>
              </SettingsGridField>
            ))}
          </InputGrid>
        </>
      )}
    </>
  );
};

StabilityStatesSettings.displayName = "StabilityStatesSettings";
