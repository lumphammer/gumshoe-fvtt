import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

import { PCSheet } from "../../components/characters/PCSheet";
import { systemId } from "../../constants";
import { ActorSheetV2 } from "../../fvtt-exports";

class PCSheetClassBase extends ActorSheetV2 {
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

export const PCSheetClass = ReactApplicationV2Mixin(
  "PCSheetClass",
  PCSheetClassBase,
  render,
);
