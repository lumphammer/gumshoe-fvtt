import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import React from "react";

import { Suspense } from "../components/Suspense";
import { RecursivePartial } from "../types";
import { InvestigatorActor } from "./InvestigatorActor";
// import { reactTemplatePath, systemId } from "../constants";

import DocumentSheetV2 = foundry.applications.api.DocumentSheetV2;

const NPCSheet = React.lazy(() =>
  import("../components/characters/NPCSheet").then(({ NPCSheet }) => ({
    default: NPCSheet,
  })),
);

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
class NPCSheetV2ClassBase extends DocumentSheetV2<InvestigatorActor> {
  static DEFAULT_OPTIONS = {
    ...foundry.applications.api.ApplicationV2.DEFAULT_OPTIONS,

    window: {
      ...foundry.applications.api.ApplicationV2.DEFAULT_OPTIONS.window,
      frame: true,
      title: "name",
    },
    position: {
      height: 660,
      width: 700,
    },
  };

  /** @override */
  // static get defaultOptions() {
  //   return foundry.utils.mergeObject(super.defaultOptions, {
  //     classes: [systemId, "sheet", "actor"],
  //     template: reactTemplatePath,
  //     width: 700,
  //     height: 660,
  //   });
  // }
}

const render = (sheet: NPCSheetV2ClassBase) => {
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
