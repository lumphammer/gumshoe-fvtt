import { ReactApplicationMixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationMixin";
import React from "react";

import { Suspense } from "../../components/Suspense";
import { reactTemplatePath, systemId } from "../../constants";

const PartySheet = React.lazy(async () => {
  const { PartySheet } = await import("../../components/party/PartySheet");
  return {
    default: PartySheet,
  };
});

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
class PartySheetClassBase extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [systemId, "sheet", "actor"],
      template: reactTemplatePath,
      width: 660,
      height: 900,
    });
  }
}

const render = (sheet: PartySheetClassBase) => {
  return (
    <Suspense>
      <PartySheet />
    </Suspense>
  );
};

export const PartySheetClass = ReactApplicationMixin(
  "PartySheetClass",
  PartySheetClassBase,
  render,
);
