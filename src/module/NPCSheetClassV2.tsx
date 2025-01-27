import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import React from "react";

import { Suspense } from "../components/Suspense";

import ActorSheetV2 = foundry.applications.sheets.ActorSheetV2;

const NPCSheet = React.lazy(() =>
  import("../components/characters/NPCSheet").then(({ NPCSheet }) => ({
    default: NPCSheet,
  })),
);

class NPCSheetV2ClassBase extends ActorSheetV2 {
  static DEFAULT_OPTIONS = {
    window: {
      frame: true,
      title: "name",
    },
    position: {
      height: 660,
      width: 700,
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

export const NPCSheetClassV2 = ReactApplicationV2Mixin(
  "NPCSheetClassV2",
  NPCSheetV2ClassBase,
  render,
);
