import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import React from "react";

import { Suspense } from "../components/Suspense";
import { InvestigatorActor } from "./InvestigatorActor";

import DocumentSheetV2 = foundry.applications.api.DocumentSheetV2;

const NPCSheet = React.lazy(() =>
  import("../components/characters/NPCSheet").then(({ NPCSheet }) => ({
    default: NPCSheet,
  })),
);

class NPCSheetV2ClassBase extends DocumentSheetV2<InvestigatorActor> {
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
  "NPCSheetClass",
  NPCSheetV2ClassBase,
  render,
);
