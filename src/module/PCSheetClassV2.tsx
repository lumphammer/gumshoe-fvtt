import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

import { PCSheet } from "../components/characters/PCSheet";
import { systemId } from "../constants";

import ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;

class PCSheetClassV2Base extends ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [systemId, "sheet", "actor"],
    position: {
      width: 777,
      height: 900,
    },
    window: {
      resizable: true,
    },
  };
}

const render = () => {
  return <PCSheet />;
};

export const PCSheetClassV2 = ReactApplicationV2Mixin(
  "PCSheetClassV2",
  PCSheetClassV2Base,
  render,
);
