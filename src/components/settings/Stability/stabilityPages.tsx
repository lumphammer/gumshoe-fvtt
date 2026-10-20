import { Translate } from "../../Translate";
import type { SettingsPageDef } from "../SettingsMenu";
import { bondsSettings, stabilityStates, traumaTypes } from "./directions";

const onOff = (on: boolean) => <Translate>{on ? "On" : "Off"}</Translate>;

/**
 * The pages under the Sanity & Stability settings, in menu order.
 */
export const stabilityPages: SettingsPageDef[] = [
  {
    direction: stabilityStates,
    label: "Stability states",
    description: "StabilityStatesDescription",
    summary: (s) => onOff(s.useStabilityStates),
  },
  {
    direction: bondsSettings,
    label: "Bonds",
    description: "BondsDescription",
    summary: (s) => onOff(s.useBonds),
  },
  {
    direction: traumaTypes,
    label: "Trauma types",
    description: "TraumaTypesDescription",
    summary: (s) => (s.useTrauma ? s.traumaTypes.length : onOff(false)),
  },
];
