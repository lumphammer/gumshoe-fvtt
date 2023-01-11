import { SettingsDict } from "../../settings";

export type Setters = {
  [k in keyof SettingsDict]: (newVal: SettingsDict[k]) => void;
};

export interface State {
  settings: SettingsDict;
}

export type PcOrNpc = "pcStats" | "npcStats";
