import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import React from "react";

import { Suspense } from "../../components/Suspense";
import { systemId } from "../../constants";
import { ActorSheetV2 } from "../../fvtt-exports";

const NPCSheet = React.lazy(() =>
  import("../../components/characters/NPCSheet").then(({ NPCSheet }) => ({
    default: NPCSheet,
  })),
);

class NPCSheetClassBase extends ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [systemId, "sheet", "actor"],
    window: {
      resizable: true,
    },
    position: {
      width: 700,
      height: 660,
    },
  };
}

const render = () => {
  return (
    <Suspense>
      <NPCSheet />
    </Suspense>
  );
};

export const NPCSheetClass = ReactApplicationV2Mixin(
  "NPCSheetClass",
  NPCSheetClassBase,
  render,
);
