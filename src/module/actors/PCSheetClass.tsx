import { ReactApplicationMixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationMixin";

import { PCSheet } from "../../components/characters/PCSheet";
import { reactTemplatePath, systemId } from "../../constants";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
class PCSheetClassBase extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [systemId, "sheet", "actor"],
      template: reactTemplatePath,
      width: 777,
      height: 900,
    });
  }
}

const render = (sheet: PCSheetClassBase) => {
  return <PCSheet />;
};

export const PCSheetClass = ReactApplicationMixin(
  "PCSheetClass",
  PCSheetClassBase,
  render,
);
