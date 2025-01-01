import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";

import { PCSheet } from "../components/characters/PCSheet";
import { reactTemplatePath, systemId } from "../constants";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
class PCSheetClassV2Base extends foundry.applications.sheets
  .ActorSheetV2<Actor> {
  /** @override */
  static DEFAULT_OPTIONS = {
    ...foundry.applications.api.ApplicationV2.DEFAULT_OPTIONS,
    classes: [systemId, "sheet", "actor"],
    template: reactTemplatePath,
    position: {
      width: 777,
      height: 900,
    },
    window: {
      resizable: true,
    },
  };
}

const render = (sheet: PCSheetClassV2Base) => {
  return <PCSheet />;
};

export const PCSheetClassV2 = ReactApplicationV2Mixin(
  "PCSheetClassV2",
  PCSheetClassV2Base,
  render,
);
